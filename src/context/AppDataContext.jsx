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

export function AppDataProvider({ children }) {
  const { currentUser } = useAuth();
  const [data, setData] = useState({
    tasks: [],
    meetings: [],
    items: [],
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
        setData({
          tasks: parsed.tasks || [],
          meetings: parsed.meetings || [],
          items: parsed.items || [],
          momTemplate: parsed.momTemplate || DEFAULT_MOM_TEMPLATE,
        });
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
      assignee: task.assignee || '',
      done: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const newData = { ...data, tasks: [...data.tasks, newTask] };
    saveData(newData);
    return newTask;
  }, [data, saveData]);

  const updateTask = useCallback((id, updates) => {
    const newTasks = data.tasks.map(t => 
      t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
    );
    saveData({ ...data, tasks: newTasks });
  }, [data, saveData]);

  const deleteTask = useCallback((id) => {
    const newTasks = data.tasks.filter(t => t.id !== id);
    saveData({ ...data, tasks: newTasks });
  }, [data, saveData]);

  const toggleTask = useCallback((id) => {
    const newTasks = data.tasks.map(t => 
      t.id === id ? { ...t, done: !t.done, updatedAt: Date.now() } : t
    );
    saveData({ ...data, tasks: newTasks });
  }, [data, saveData]);

  const bulkDeleteTasks = useCallback((ids) => {
    const newTasks = data.tasks.filter(t => !ids.includes(t.id));
    saveData({ ...data, tasks: newTasks });
  }, [data, saveData]);

  const bulkCompleteTasks = useCallback((ids) => {
    const newTasks = data.tasks.map(t => 
      ids.includes(t.id) ? { ...t, done: true, updatedAt: Date.now() } : t
    );
    saveData({ ...data, tasks: newTasks });
  }, [data, saveData]);

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
      bulkDeleteTasks,
      bulkCompleteTasks,
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
