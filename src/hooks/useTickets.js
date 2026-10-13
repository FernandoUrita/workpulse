import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';

// ─── NORMALIZE SNAKE_CASE → CAMELCASE ───────────
function normalizeTicket(t) {
  return {
    id: t.id,
    ticketNo: t.ticket_no,
    clientName: t.client_name,
    remarks: t.remarks || '',
    subject: t.subject || '',
    dateLastUpdate: t.date_last_update,
    pendingTo: t.pending_to,
    status: t.status,
    timeline: t.timeline,
    dateCreated: t.date_created,
    category: t.category,
    priority: t.priority,
    taskType: t.task_type,
    comments: t.comments || [],
    auditLog: t.audit_log || [],
    createdAt: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
    updatedAt: t.updated_at ? new Date(t.updated_at).getTime() : Date.now(),
    user_id: t.user_id,
  };
}

export function useTickets() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── FETCH ──────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    if (!currentUser) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setTickets((data || []).map(normalizeTicket));
      setError(null);
    } catch (err) {
      console.error('❌ fetchTickets error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // ─── REALTIME ───────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    fetchTickets();

    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        (payload) => {
          console.log('🔄 Realtime ticket:', payload);
          if (payload.eventType === 'INSERT') {
            setTickets(prev => [normalizeTicket(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTickets(prev => prev.map(t => t.id === payload.new.id ? normalizeTicket(payload.new) : t));
          } else if (payload.eventType === 'DELETE') {
            setTickets(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser, fetchTickets]);

  // ─── ADD ────────────────────────────────────────
  const addTicket = useCallback(async (ticket) => {
    if (!currentUser) return null;

    const newTicket = {
      user_id: currentUser.id,
      ticket_no: ticket.ticketNo,
      client_name: ticket.clientName || '',
      remarks: ticket.remarks || '',
      subject: ticket.subject || '',
      date_last_update: ticket.dateLastUpdate || null,
      pending_to: ticket.pendingTo || 'Client',
      status: ticket.status || 'Open',
      timeline: ticket.timeline || null,
      date_created: ticket.dateCreated || new Date().toISOString(),
      category: ticket.category || 'Explanation',
      priority: ticket.priority || 'Medium',
      task_type: ticket.taskType || 'support',
      comments: [],
      audit_log: [{
        id: Date.now() + Math.random(),
        action: 'created',
        user: currentUser.username,
        timestamp: Date.now(),
      }],
    };

    try {
      const { data, error: insertError } = await supabase
        .from('tickets')
        .insert(newTicket)
        .select()
        .single();

      if (insertError) throw insertError;

      const normalized = normalizeTicket(data);
      setTickets(prev => [normalized, ...prev.filter(t => t.id !== normalized.id)]);
      return normalized;
    } catch (err) {
      console.error('❌ addTicket error:', err);
      setError(err.message);
      throw err;
    }
  }, [currentUser]);

  // ─── UPDATE ─────────────────────────────────────
  const updateTicket = useCallback(async (id, updates) => {
    if (!currentUser) return;

    const oldTicket = tickets.find(t => t.id === id);
    if (!oldTicket) return;

    // Compute changes
    const changes = {};
    const fieldMap = {
      ticketNo: 'ticket_no',
      clientName: 'client_name',
      remarks: 'remarks',
      subject: 'subject',
      dateLastUpdate: 'date_last_update',
      pendingTo: 'pending_to',
      status: 'status',
      timeline: 'timeline',
      category: 'category',
      priority: 'priority',
    };

    // Convert camelCase updates → snake_case
    const snakeUpdates = {};
    Object.entries(updates).forEach(([key, val]) => {
      const snakeKey = fieldMap[key] || key;
      snakeUpdates[snakeKey] = val;
      if (oldTicket[key] !== val) {
        changes[key] = { from: oldTicket[key], to: val };
      }
    });

    const auditLog = [...(oldTicket.auditLog || [])];
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
        .from('tickets')
        .update({ ...snakeUpdates, audit_log: auditLog })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const normalized = normalizeTicket(data);
      setTickets(prev => prev.map(t => t.id === id ? normalized : t));
      return normalized;
    } catch (err) {
      console.error('❌ updateTicket error:', err);
      setError(err.message);
      throw err;
    }
  }, [currentUser, tickets]);

  // ─── DELETE ─────────────────────────────────────
  const deleteTicket = useCallback(async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setTickets(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('❌ deleteTicket error:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  const bulkDeleteTickets = useCallback(async (ids) => {
    try {
      const { error: deleteError } = await supabase
        .from('tickets')
        .delete()
        .in('id', ids);

      if (deleteError) throw deleteError;

      setTickets(prev => prev.filter(t => !ids.includes(t.id)));
    } catch (err) {
      console.error('❌ bulkDeleteTickets error:', err);
      setError(err.message);
    }
  }, []);

  // ─── IMPORT ─────────────────────────────────────
  const importTickets = useCallback(async (ticketList) => {
    if (!currentUser) return [];

    const newTickets = ticketList.map(ticket => ({
      user_id: currentUser.id,
      ticket_no: ticket.ticketNo,
      client_name: ticket.clientName || '',
      remarks: ticket.remarks || '',
      subject: ticket.subject || '',
      date_last_update: ticket.dateLastUpdate || null,
      pending_to: ticket.pendingTo || 'Client',
      status: ticket.status || 'Open',
      timeline: ticket.timeline || null,
      date_created: ticket.dateCreated || new Date().toISOString(),
      category: ticket.category || 'Explanation',
      priority: ticket.priority || 'Medium',
      task_type: ticket.taskType || 'support',
      comments: [],
      audit_log: [{
        id: Date.now() + Math.random(),
        action: 'imported',
        user: currentUser.username,
        timestamp: Date.now(),
      }],
    }));

    try {
      const { data, error: insertError } = await supabase
        .from('tickets')
        .insert(newTickets)
        .select();

      if (insertError) throw insertError;

      const normalized = (data || []).map(normalizeTicket);
      setTickets(prev => [...normalized, ...prev]);
      return normalized;
    } catch (err) {
      console.error('❌ importTickets error:', err);
      setError(err.message);
      throw err;
    }
  }, [currentUser]);

  // ─── MOVE TO KANBAN ─────────────────────────────
  const moveTicketToColumn = useCallback(async (id, newStatus) => {
    const ticket = tickets.find(t => t.id === id);
    if (!ticket || ticket.status === newStatus) return;

    const auditLog = [
      ...(ticket.auditLog || []),
      {
        id: Date.now() + Math.random(),
        action: 'updated',
        user: currentUser?.username || 'system',
        timestamp: Date.now(),
        changes: {
          status: { from: ticket.status, to: newStatus },
        },
      },
    ];

    try {
      const { data, error: updateError } = await supabase
        .from('tickets')
        .update({ status: newStatus, audit_log: auditLog })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setTickets(prev => prev.map(t => t.id === id ? normalizeTicket(data) : t));
    } catch (err) {
      console.error('❌ moveTicketToColumn error:', err);
      setError(err.message);
    }
  }, [tickets, currentUser]);

  // ─── REMARKS (comments) ─────────────────────────
  const addTicketRemark = useCallback(async (ticketId, text) => {
    if (!text || !text.trim()) return;
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const remark = {
      id: Date.now() + Math.random(),
      text: text.trim(),
      author: currentUser?.username || 'unknown',
      authorName: currentUser?.name || 'Unknown',
      timestamp: Date.now(),
    };

    const auditLog = [
      ...(ticket.auditLog || []),
      {
        id: Date.now() + Math.random(),
        action: 'remark_added',
        user: currentUser?.username || 'system',
        timestamp: Date.now(),
      },
    ];

    try {
      const { data, error: updateError } = await supabase
        .from('tickets')
        .update({
          comments: [...(ticket.comments || []), remark],
          audit_log: auditLog,
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (updateError) throw updateError;

      setTickets(prev => prev.map(t => t.id === ticketId ? normalizeTicket(data) : t));
    } catch (err) {
      console.error('❌ addTicketRemark error:', err);
      setError(err.message);
    }
  }, [tickets, currentUser]);

  const deleteTicketRemark = useCallback(async (ticketId, remarkId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    try {
      const { data, error: updateError } = await supabase
        .from('tickets')
        .update({
          comments: (ticket.comments || []).filter(r => r.id !== remarkId),
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (updateError) throw updateError;

      setTickets(prev => prev.map(t => t.id === ticketId ? normalizeTicket(data) : t));
    } catch (err) {
      console.error('❌ deleteTicketRemark error:', err);
      setError(err.message);
    }
  }, [tickets]);

  return {
    tickets,
    loading,
    error,
    refetch: fetchTickets,
    addTicket,
    updateTicket,
    deleteTicket,
    bulkDeleteTickets,
    importTickets,
    moveTicketToColumn,
    addTicketRemark,
    deleteTicketRemark,
  };
}
