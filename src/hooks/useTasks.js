import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';

// ─── NORMALIZE SNAKE_CASE → CAMELCASE ───────────
function normalizeTask(task) {
  return {
    id: task.id,
    text: task.text,
    description: task.description,
    priority: task.priority,
    category: task.category,
    dueDate: task.due_date,
    assignees: task.assignees || [],
    done: task.done,
    kanbanStatus: task.kanban_status,
    remarks: task.remarks || [],
    auditLog: task.audit_log || [],
    createdBy: task.created_by,
    createdAt: task.created_at ? new Date(task.created_at).getTime() : Date.now(),
    updatedAt: task.updated_at ? new Date(task.updated_at).getTime() : Date.now(),
    user_id: task.user_id,
  };
}

export function useTasks() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── FETCH TASKS ────────────────────────────────
  const fetchTasks = useCallback(async () => {
    if (!currentUser) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setTasks((data || []).map(normalizeTask));
      setError(null);
    } catch (err) {
      console.error('❌ fetchTasks error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // ─── REALTIME SUBSCRIPTION ──────────────────────
  useEffect(() => {
    if (!currentUser) return;

    fetchTasks();

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('🔄 Realtime update:', payload);
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [normalizeTask(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? normalizeTask(payload.new) : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, fetchTasks]);

  // ─── ADD TASK ───────────────────────────────────
  const addTask = useCallback(async (task) => {
    if (!currentUser) return null;

    const newTask = {
      user_id: currentUser.id,
      text: task.text,
      description: task.description || '',
      priority: task.priority || 'medium',
      category: task.category || 'work',
      due_date: task.dueDate || null,
      assignees: Array.isArray(task.assignees) ? task.assignees : [],
      done: false,
      kanban_status: 'todo',
      remarks: [],
      audit_log: [{
        id: Date.now() + Math.random(),
        action: 'created',
        user: currentUser.username,
        timestamp: Date.now(),
      }],
      created_by: currentUser.username,
    };

    try {
      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

      if (insertError) throw insertError;

      // Optimistic update (para hindi mag-hintay sa realtime)
      const normalized = normalizeTask(data);
      setTasks(prev => [normalized, ...prev.filter(t => t.id !== normalized.id)]);
      return normalized;
    } catch (err) {
      console.error('❌ addTask error:', err);
      setError(err.message);
      throw err;
    }
  }, [currentUser]);

  // ─── UPDATE TASK ────────────────────────────────
  const updateTask = useCallback(async (id, updates) => {
    if (!currentUser) return;

    const oldTask = tasks.find(t => t.id === id);
    if (!oldTask) return;

    // Compute changes for audit log
    const changes = {};
    const fields = ['text', 'description', 'priority', 'category', 'due_date', 'assignees', 'done', 'kanban_status'];
    fields.forEach(f => {
      if (f in updates && JSON.stringify(updates[f]) !== JSON.stringify(oldTask[f])) {
        changes[f] = { from: oldTask[f], to: updates[f] };
      }
    });

    const auditLog = [...(oldTask.audit_log || [])];
    if (Object.keys(changes).length > 0) {
      auditLog.push({
        id: Date.now() + Math.random(),
        action: 'updated',
        user: currentUser.username,
        timestamp: Date.now(),
        changes,
      });
    }

    try {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({ ...updates, audit_log: auditLog })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const normalized = normalizeTask(data);
      setTasks(prev => [normalized, ...prev.filter(t => t.id !== normalized.id)]);
      return normalized;
    } catch (err) {
      console.error('❌ updateTask error:', err);
      setError(err.message);
      throw err;
    }
  }, [currentUser, tasks]);

  // ─── DELETE TASK ────────────────────────────────
  const deleteTask = useCallback(async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('❌ deleteTask error:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // ─── TOGGLE TASK ────────────────────────────────
  const toggleTask = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newDone = !task.done;
    const auditLog = [
      ...(task.audit_log || []),
      {
        id: Date.now() + Math.random(),
        action: newDone ? 'completed' : 'reopened',
        user: currentUser?.username || 'system',
        timestamp: Date.now(),
      },
    ];

    try {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({
          done: newDone,
          kanban_status: newDone ? 'done' : 'todo',
          audit_log: auditLog,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setTasks(prev => prev.map(t => t.id === id ? normalizeTask(data) : t));
    } catch (err) {
      console.error('❌ toggleTask error:', err);
      setError(err.message);
    }
  }, [tasks, currentUser]);

  // ─── MOVE TO KANBAN COLUMN ──────────────────────
  const moveTaskToColumn = useCallback(async (id, newStatus) => {
    const task = tasks.find(t => t.id === id);
    if (!task || task.kanban_status === newStatus) return;

    const isDone = newStatus === 'done';
    const auditLog = [
      ...(task.audit_log || []),
      {
        id: Date.now() + Math.random(),
        action: 'updated',
        user: currentUser?.username || 'system',
        timestamp: Date.now(),
        changes: {
          kanban_status: { from: task.kanban_status, to: newStatus },
          done: { from: task.done, to: isDone },
        },
      },
    ];

    try {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({
          kanban_status: newStatus,
          done: isDone,
          audit_log: auditLog,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setTasks(prev => prev.map(t => t.id === id ? normalizeTask(data) : t));
    } catch (err) {
      console.error('❌ moveTaskToColumn error:', err);
      setError(err.message);
    }
  }, [tasks, currentUser]);

  // ─── BULK DELETE ────────────────────────────────
  const bulkDeleteTasks = useCallback(async (ids) => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .in('id', ids);

      if (deleteError) throw deleteError;

      setTasks(prev => prev.filter(t => !ids.includes(t.id)));
    } catch (err) {
      console.error('❌ bulkDeleteTasks error:', err);
      setError(err.message);
    }
  }, []);

  // ─── BULK COMPLETE ──────────────────────────────
  const bulkCompleteTasks = useCallback(async (ids) => {
    try {
      const tasksToUpdate = tasks.filter(t => ids.includes(t.id));
      const updates = tasksToUpdate.map(t => ({
        ...t,
        done: true,
        kanban_status: 'done',
        audit_log: [
          ...(t.audit_log || []),
          {
            id: Date.now() + Math.random(),
            action: 'completed',
            user: currentUser?.username || 'system',
            timestamp: Date.now(),
          },
        ],
      }));

      const { error: updateError } = await supabase
        .from('tasks')
        .upsert(updates);

      if (updateError) throw updateError;

      setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, done: true, kanbanStatus: 'done' } : t));
    } catch (err) {
      console.error('❌ bulkCompleteTasks error:', err);
      setError(err.message);
    }
  }, [tasks, currentUser]);

  // ─── REMARKS ────────────────────────────────────
  const addRemark = useCallback(async (taskId, text) => {
    if (!text || !text.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const remark = {
      id: Date.now() + Math.random(),
      text: text.trim(),
      author: currentUser?.username || 'unknown',
      authorName: currentUser?.name || 'Unknown',
      timestamp: Date.now(),
    };

    const auditLog = [
      ...(task.audit_log || []),
      {
        id: Date.now() + Math.random(),
        action: 'remark_added',
        user: currentUser?.username || 'system',
        timestamp: Date.now(),
      },
    ];

    try {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({
          remarks: [...(task.remarks || []), remark],
          audit_log: auditLog,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) throw updateError;

      setTasks(prev => prev.map(t => t.id === taskId ? normalizeTask(data) : t));
    } catch (err) {
      console.error('❌ addRemark error:', err);
      setError(err.message);
    }
  }, [tasks, currentUser]);

  const deleteRemark = useCallback(async (taskId, remarkId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({
          remarks: (task.remarks || []).filter(r => r.id !== remarkId),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) throw updateError;

      setTasks(prev => prev.map(t => t.id === taskId ? normalizeTask(data) : t));
    } catch (err) {
      console.error('❌ deleteRemark error:', err);
      setError(err.message);
    }
  }, [tasks]);

  // ─── ASSIGNEES ──────────────────────────────────
  const addAssignee = useCallback(async (taskId, username) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const current = task.assignees || [];
    if (current.includes(username)) return;

    try {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({
          assignees: [...current, username],
          audit_log: [
            ...(task.audit_log || []),
            {
              id: Date.now() + Math.random(),
              action: 'assignee_added',
              user: currentUser?.username || 'system',
              timestamp: Date.now(),
              changes: { assignees: { from: current, to: [...current, username] } },
            },
          ],
        })
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) throw updateError;

      setTasks(prev => prev.map(t => t.id === taskId ? normalizeTask(data) : t));
    } catch (err) {
      console.error('❌ addAssignee error:', err);
      setError(err.message);
    }
  }, [tasks, currentUser]);

  const removeAssignee = useCallback(async (taskId, username) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newAssignees = (task.assignees || []).filter(a => a !== username);

    try {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({
          assignees: newAssignees,
          audit_log: [
            ...(task.audit_log || []),
            {
              id: Date.now() + Math.random(),
              action: 'assignee_removed',
              user: currentUser?.username || 'system',
              timestamp: Date.now(),
              changes: { assignees: { from: task.assignees, to: newAssignees } },
            },
          ],
        })
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) throw updateError;

      setTasks(prev => prev.map(t => t.id === taskId ? normalizeTask(data) : t));
    } catch (err) {
      console.error('❌ removeAssignee error:', err);
      setError(err.message);
    }
  }, [tasks, currentUser]);

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    moveTaskToColumn,
    bulkDeleteTasks,
    bulkCompleteTasks,
    addRemark,
    deleteRemark,
    addAssignee,
    removeAssignee,
  };
}
