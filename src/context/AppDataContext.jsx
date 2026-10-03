import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const AppDataContext = createContext(null);

const DEFAULT_MOM_TEMPLATE = `====================================================================
                    MEETING MINUTES
====================================================================

Hi, Team,

Good day.

This is to document our meeting earlier. Please see below details
for your reference.

--------------------------------------------------------------------
MEETING DETAILS
--------------------------------------------------------------------

Agenda:     {title}
Date:       {date}
Time:       {time}
Type:       {type}
Platform:   {platform}
Location:   {location}
Link:       {link}
Credentials:{credentials}

--------------------------------------------------------------------
ATTENDEES
--------------------------------------------------------------------

{attendees}

--------------------------------------------------------------------
AGENDA ITEMS
--------------------------------------------------------------------

{agenda}

--------------------------------------------------------------------
DISCUSSION / NOTES
--------------------------------------------------------------------

[Add discussion points here...]

--------------------------------------------------------------------
ACTION ITEMS
--------------------------------------------------------------------

[Add action items here...]

--------------------------------------------------------------------
NEXT MEETING
--------------------------------------------------------------------

[Schedule next meeting here...]

--------------------------------------------------------------------
Prepared by: ___________________
Date: ___________________
--------------------------------------------------------------------

Thank you.`;

// ─── MIGRATION HELPERS ──────────────────────────
function migrateTask(task, fallbackUser) {
  const migrated = { ...task };

  // assignee (string) → assignees (array)
  if (!Array.isArray(migrated.assignees)) {
    if (typeof migrated.assignee === 'string' && migrated.assignee.trim()) {
      migrated.assignees = [migrated.assignee.trim()];
    } else {
      migrated.assignees = [];
    }
  }
  delete migrated.assignee;

  // createdBy
  if (!migrated.createdBy) {
    migrated.createdBy = fallbackUser || 'admin';
  }

  // remarks array
  if (!Array.isArray(migrated.remarks)) {
    migrated.remarks = [];
  }

  // auditLog array
  if (!Array.isArray(migrated.auditLog)) {
    migrated.auditLog = [];
  }

  // kanbanStatus (for future B6)
  if (!migrated.kanbanStatus) {
    migrated.kanbanStatus = migrated.done ? 'done' : 'todo';
  }

  return migrated;
}

function migrateData(data, fallbackUser) {
  return {
    tasks: (data.tasks || []).map(t => migrateTask(t, fallbackUser)),
    meetings: data.meetings || [],
    items: data.items || [],
    tickets: data.tickets || [],
    momTemplate: data.momTemplate || DEFAULT_MOM_TEMPLATE,
  };
}

// ─── AUDIT HELPERS ──────────────────────────────
function makeAuditEntry(action, user, changes = null) {
  return {
    id: Date.now() + Math.random(),
    action,
    user: user || 'system',
    timestamp: Date.now(),
    changes,
  };
}

function computeChanges(oldTask, updates) {
  const changes = {};
  const fields = ['text', 'description', 'priority', 'category', 'dueDate', 'assignees', 'done', 'kanbanStatus'];
  fields.forEach(f => {
    if (f in updates) {
      const oldVal = oldTask[f];
      const newVal = updates[f];
      const oldStr = JSON.stringify(oldVal);
      const newStr = JSON.stringify(newVal);
      if (oldStr !== newStr) {
        changes[f] = { from: oldVal, to: newVal };
      }
    }
  });
  return Object.keys(changes).length > 0 ? changes : null;
}

export function AppDataProvider({ children }) {
  const { currentUser } = useAuth();
  const [data, setData] = useState({
    tasks: [],
    meetings: [],
    items: [],
    tickets: [],
    momTemplate: DEFAULT_MOM_TEMPLATE,
  });
  const [loading, setLoading] = useState(true);

  // Load data when user changes
  useEffect(() => {
    if (!currentUser) {
      setData({
        tasks: [],
        meetings: [],
        items: [],
        tickets: [],
        momTemplate: DEFAULT_MOM_TEMPLATE,
      });
      setLoading(false);
      return;
    }

    const key = `workpulse_data_${currentUser.username}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated = migrateData(parsed, currentUser.username);
        setData(migrated);
        // Save migrated data back
        localStorage.setItem(key, JSON.stringify(migrated));
      } catch (e) {
        console.error('Error loading data:', e);
      }
    } else {
      setData({
        tasks: [],
        meetings: [],
        items: [],
        momTemplate: DEFAULT_MOM_TEMPLATE,
      });
    }
    setLoading(false);
  }, [currentUser]);

  // Save data
  const saveData = useCallback((newData) => {
    if (!currentUser) return;
    const key = `workpulse_data_${currentUser.username}`;
    const toSave = newData !== undefined ? newData : data;
    localStorage.setItem(key, JSON.stringify(toSave));
    if (newData !== undefined) setData(newData);
  }, [currentUser, data]);

  // ─── TASKS ─────────────────────────────────────
  const addTask = useCallback((task) => {
    const newTask = {
      id: Date.now() + Math.random(),
      text: task.text,
      description: task.description || '',
      priority: task.priority || 'medium',
      category: task.category || 'work',
      dueDate: task.dueDate || '',
      assignees: Array.isArray(task.assignees) ? task.assignees : [],
      done: false,
      kanbanStatus: 'todo',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser?.username || 'unknown',
      remarks: [],
      auditLog: [makeAuditEntry('created', currentUser?.username)],
    };
    const newData = { ...data, tasks: [...data.tasks, newTask] };
    saveData(newData);
    return newTask;
  }, [data, saveData, currentUser]);

  const updateTask = useCallback((id, updates) => {
    const oldTask = data.tasks.find(t => t.id === id);
    if (!oldTask) return;

    const changes = computeChanges(oldTask, updates);

    const newTasks = data.tasks.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates, updatedAt: Date.now() };
      if (changes) {
        updated.auditLog = [
          ...(t.auditLog || []),
          makeAuditEntry('updated', currentUser?.username, changes),
        ];
      }
      return updated;
    });
    saveData({ ...data, tasks: newTasks });
  }, [data, saveData, currentUser]);

  const deleteTask = useCallback((id) => {
    const newTasks = data.tasks.filter(t => t.id !== id);
    saveData({ ...data, tasks: newTasks });
  }, [data, saveData]);

  const toggleTask = useCallback((id) => {
    const oldTask = data.tasks.find(t => t.id === id);
    if (!oldTask) return;

    const newDone = !oldTask.done;
    const newTasks = data.tasks.map(t => {
      if (t.id !== id) return t;
      return {
        ...t,
        done: newDone,
        kanbanStatus: newDone ? 'done' : 'todo',
        updatedAt: Date.now(),
        auditLog: [
          ...(t.auditLog || []),
          makeAuditEntry(newDone ? 'completed' : 'reopened', currentUser?.username),
        ],
      };
    });
    saveData({ ...data, tasks: newTasks });
  }, [data, saveData, currentUser]);
  
  // ─── MOVE TASK TO KANBAN COLUMN ────────────────
  const moveTaskToColumn = useCallback((taskId, newStatus) => {
    const newTasks = data.tasks.map(t => {
      if (t.id !== taskId) return t;
      const oldStatus = t.kanbanStatus || 'todo';
      if (oldStatus === newStatus) return t;

      const isDone = newStatus === 'done';
      const auditEntry = {
        id: Date.now() + Math.random(),
        action: 'updated',
        user: currentUser?.username || 'system',
        timestamp: Date.now(),
        changes: {
          kanbanStatus: { from: oldStatus, to: newStatus },
          done: { from: t.done, to: isDone },
        },
      };

      return {
        ...t,
        kanbanStatus: newStatus,
        done: isDone,
        updatedAt: Date.now(),
        auditLog: [...(t.auditLog || []), auditEntry],
      };
    });
    saveData({ ...data, tasks: newTasks });
  }, [data, saveData, currentUser]);

  const bulkDeleteTasks = useCallback((ids) => {
    const newTasks = data.tasks.filter(t => !ids.includes(t.id));
    saveData({ ...data, tasks: newTasks });
  }, [data, saveData]);

  const bulkCompleteTasks = useCallback((ids) => {
    const newTasks = data.tasks.map(t => {
      if (!ids.includes(t.id)) return t;
      return {
        ...t,
        done: true,
        kanbanStatus: 'done',
        updatedAt: Date.now(),
        auditLog: [
          ...(t.auditLog || []),
          makeAuditEntry('completed', currentUser?.username),
        ],
      };
    });
    saveData({ ...data, tasks: newTasks });
  }, [data, saveData, currentUser]);

  // ─── REMARKS ───────────────────────────────────
  const addRemark = useCallback((taskId, text) => {
    if (!text || !text.trim()) return;
    const newTasks = data.tasks.map(t => {
      if (t.id !== taskId) return t;
      const remark = {
        id: Date.now() + Math.random(),
        text: text.trim(),
        author: currentUser?.username || 'unknown',
        authorName: currentUser?.name || 'Unknown',
        timestamp: Date.now(),
      };
      return {
        ...t,
        updatedAt: Date.now(),
        remarks: [...(t.remarks || []), remark],
        auditLog: [
          ...(t.auditLog || []),
          makeAuditEntry('remark_added', currentUser?.username),
        ],
      };
    });
    saveData({ ...data, tasks: newTasks });
  }, [data, saveData, currentUser]);

  const deleteRemark = useCallback((taskId, remarkId) => {
    const newTasks = data.tasks.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        updatedAt: Date.now(),
        remarks: (t.remarks || []).filter(r => r.id !== remarkId),
      };
    });
    saveData({ ...data, tasks: newTasks });
  }, [data, saveData]);

  // ─── ASSIGNEES ─────────────────────────────────
  const addAssignee = useCallback((taskId, username) => {
    const newTasks = data.tasks.map(t => {
      if (t.id !== taskId) return t;
      const current = t.assignees || [];
      if (current.includes(username)) return t;
      return {
        ...t,
        assignees: [...current, username],
        updatedAt: Date.now(),
        auditLog: [
          ...(t.auditLog || []),
          makeAuditEntry('assignee_added', currentUser?.username, {
            assignees: { from: current, to: [...current, username] },
          }),
        ],
      };
    });
    saveData({ ...data, tasks: newTasks });
  }, [data, saveData, currentUser]);

  const removeAssignee = useCallback((taskId, username) => {
    const newTasks = data.tasks.map(t => {
      if (t.id !== taskId) return t;
      const current = t.assignees || [];
      return {
        ...t,
        assignees: current.filter(a => a !== username),
        updatedAt: Date.now(),
        auditLog: [
          ...(t.auditLog || []),
          makeAuditEntry('assignee_removed', currentUser?.username, {
            assignees: { from: current, to: current.filter(a => a !== username) },
          }),
        ],
      };
    });
    saveData({ ...data, tasks: newTasks });
  }, [data, saveData, currentUser]);

  // ─── MEETINGS ──────────────────────────────────
  const addMeeting = useCallback((meeting) => {
    const newMeeting = {
      id: Date.now() + Math.random(),
      ...meeting,
      completed: false,
      mom: null,
      createdAt: Date.now(),
    };
    const newData = { ...data, meetings: [...data.meetings, newMeeting] };
    saveData(newData);
    return newMeeting;
  }, [data, saveData]);

  const updateMeeting = useCallback((id, updates) => {
    const newMeetings = data.meetings.map(m =>
      m.id === id ? { ...m, ...updates } : m
    );
    saveData({ ...data, meetings: newMeetings });
  }, [data, saveData]);

  const deleteMeeting = useCallback((id) => {
    const newMeetings = data.meetings.filter(m => m.id !== id);
    saveData({ ...data, meetings: newMeetings });
  }, [data, saveData]);

  const completeMeeting = useCallback((id, mom) => {
    const newMeetings = data.meetings.map(m =>
      m.id === id ? { ...m, completed: true, mom } : m
    );
    saveData({ ...data, meetings: newMeetings });
  }, [data, saveData]);

  // ─── ITEMS ─────────────────────────────────────
  const addItem = useCallback((item) => {
    const newItem = {
      id: Date.now() + Math.random(),
      ...item,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      checkinLog: [],
    };
    const newData = { ...data, items: [...data.items, newItem] };
    saveData(newData);
    return newItem;
  }, [data, saveData]);

  const updateItem = useCallback((id, updates) => {
    const newItems = data.items.map(i =>
      i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i
    );
    saveData({ ...data, items: newItems });
  }, [data, saveData]);

  const deleteItem = useCallback((id) => {
    const newItems = data.items.filter(i => i.id !== id);
    saveData({ ...data, items: newItems });
  }, [data, saveData]);

  const addCheckin = useCallback((id, note, nextDate) => {
    const newItems = data.items.map(i => {
      if (i.id !== id) return i;
      return {
        ...i,
        checkinLog: [...(i.checkinLog || []), { time: Date.now(), note: note || '(no note)' }],
        lastCheck: Date.now(),
        nextCheck: nextDate || '',
      };
    });
    saveData({ ...data, items: newItems });
  }, [data, saveData]);

  // ─── TICKETS ───────────────────────────────────
  const addTicket = useCallback((ticket) => {
    const newTicket = {
      id: `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ticketNo: ticket.ticketNo || '',
      clientName: ticket.clientName || '',
      remarks: ticket.remarks || '',
      subject: ticket.subject || '',
      dateLastUpdate: ticket.dateLastUpdate || '',
      pendingTo: ticket.pendingTo || 'Client',
      status: ticket.status || 'Open',
      timeline: ticket.timeline || '',
      dateCreated: ticket.dateCreated || new Date().toISOString(),
      category: ticket.category || 'Explanation',
      priority: ticket.priority || 'Medium',
      taskType: ticket.taskType || 'support',
      auditLog: [{
        id: Date.now() + Math.random(),
        action: 'created',
        user: currentUser?.username || 'system',
        timestamp: Date.now(),
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const newData = { ...data, tickets: [...(data.tickets || []), newTicket] };
    saveData(newData);
    return newTicket;
  }, [data, saveData, currentUser]);

  const updateTicket = useCallback((id, updates) => {
    const oldTicket = (data.tickets || []).find(t => t.id === id);
    if (!oldTicket) return;

    const changes = {};
    ['ticketNo', 'clientName', 'remarks', 'subject', 'status', 'category', 'priority', 'pendingTo', 'timeline', 'dateLastUpdate'].forEach(f => {
      if (f in updates && updates[f] !== oldTicket[f]) {
        changes[f] = { from: oldTicket[f], to: updates[f] };
      }
    });

    const newTickets = (data.tickets || []).map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates, updatedAt: Date.now() };
      if (Object.keys(changes).length > 0) {
        updated.auditLog = [
          ...(t.auditLog || []),
          {
            id: Date.now() + Math.random(),
            action: 'updated',
            user: currentUser?.username || 'system',
            timestamp: Date.now(),
            changes,
          },
        ];
      }
      return updated;
    });
    saveData({ ...data, tickets: newTickets });
  }, [data, saveData, currentUser]);

  const deleteTicket = useCallback((id) => {
    const newTickets = (data.tickets || []).filter(t => t.id !== id);
    saveData({ ...data, tickets: newTickets });
  }, [data, saveData]);

  const bulkDeleteTickets = useCallback((ids) => {
    const newTickets = (data.tickets || []).filter(t => !ids.includes(t.id));
    saveData({ ...data, tickets: newTickets });
  }, [data, saveData]);

  const importTickets = useCallback((tickets) => {
    const newTickets = tickets.map(ticket => ({
      id: `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ticketNo: ticket.ticketNo || '',
      clientName: ticket.clientName || '',
      remarks: ticket.remarks || '',
      subject: ticket.subject || '',
      dateLastUpdate: ticket.dateLastUpdate || '',
      pendingTo: ticket.pendingTo || 'Client',
      status: ticket.status || 'Open',
      timeline: ticket.timeline || '',
      dateCreated: ticket.dateCreated || new Date().toISOString(),
      category: ticket.category || 'Explanation',
      priority: ticket.priority || 'Medium',
      taskType: ticket.taskType || 'support',
      auditLog: [{
        id: Date.now() + Math.random(),
        action: 'imported',
        user: currentUser?.username || 'system',
        timestamp: Date.now(),
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    const newData = { ...data, tickets: [...(data.tickets || []), ...newTickets] };
    saveData(newData);
    return newTickets;
  }, [data, saveData, currentUser]);

  
    const addTicketRemark = useCallback((ticketId, text) => {
    if (!text || !text.trim()) return;
    const newTickets = (data.tickets || []).map(t => {
      if (t.id !== ticketId) return t;
      const remark = {
        id: Date.now() + Math.random(),
        text: text.trim(),
        author: currentUser?.username || 'unknown',
        authorName: currentUser?.name || 'Unknown',
        timestamp: Date.now(),
      };
      return {
        ...t,
        updatedAt: Date.now(),
        comments: [...(t.comments || []), remark],   // ← PALITAN: comments
        auditLog: [
          ...(t.auditLog || []),
          {
            id: Date.now() + Math.random(),
            action: 'remark_added',
            user: currentUser?.username || 'system',
            timestamp: Date.now(),
          },
        ],
      };
    });
    saveData({ ...data, tickets: newTickets });
  }, [data, saveData, currentUser]);

  const deleteTicketRemark = useCallback((ticketId, remarkId) => {
    const newTickets = (data.tickets || []).map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        updatedAt: Date.now(),
        comments: (t.comments || []).filter(r => r.id !== remarkId),   // ← PALITAN: comments
      };
    });
    saveData({ ...data, tickets: newTickets });
  }, [data, saveData]);

  const moveTicketToColumn = useCallback((ticketId, newStatus) => {
    const newTickets = (data.tickets || []).map(t => {
      if (t.id !== ticketId) return t;
      const oldStatus = t.status || 'Open';
      if (oldStatus === newStatus) return t;

      const auditEntry = {
        id: Date.now() + Math.random(),
        action: 'updated',
        user: currentUser?.username || 'system',
        timestamp: Date.now(),
        changes: {
          status: { from: oldStatus, to: newStatus },
        },
      };

      return {
        ...t,
        status: newStatus,
        updatedAt: Date.now(),
        auditLog: [...(t.auditLog || []), auditEntry],
      };
    });
    saveData({ ...data, tickets: newTickets });
  }, [data, saveData, currentUser]);

  // ─── MOM TEMPLATE ──────────────────────────────
  const updateMomTemplate = useCallback((template) => {
    saveData({ ...data, momTemplate: template });
  }, [data, saveData]);

  const resetMomTemplate = useCallback(() => {
    saveData({ ...data, momTemplate: DEFAULT_MOM_TEMPLATE });
  }, [data, saveData]);

  // ─── CLEAR ALL ─────────────────────────────────
  const clearAllData = useCallback(() => {
    saveData({
      tasks: [],
      meetings: [],
      items: [],
      tickets: [],
      momTemplate: DEFAULT_MOM_TEMPLATE,
    });
  }, [saveData]);

  return (
    <AppDataContext.Provider value={{
      // Data
      tasks: data.tasks,
      meetings: data.meetings,
      items: data.items,
      momTemplate: data.momTemplate,
      loading,
      defaultMomTemplate: DEFAULT_MOM_TEMPLATE,
      // Tasks
      addTask,
      updateTask,
      deleteTask,
      toggleTask,
      moveTaskToColumn,    // ← BAGONG LINE
      bulkDeleteTasks,
      bulkCompleteTasks,
      // Remarks
      addRemark,
      deleteRemark,
      // Assignees
      addAssignee,
      removeAssignee,
      // Meetings
      addMeeting,
      updateMeeting,
      deleteMeeting,
      completeMeeting,
      // Items
      addItem,
      updateItem,
      deleteItem,
      addCheckin,
      // Tickets
      tickets: data.tickets || [],
      addTicket,
      updateTicket,
      deleteTicket,
      bulkDeleteTickets,
      importTickets,
      addTicketRemark,
      deleteTicketRemark,
      moveTicketToColumn,
      // MOM
      updateMomTemplate,
      resetMomTemplate,
      // Utility
      clearAllData,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within AppDataProvider');
  return context;
}
