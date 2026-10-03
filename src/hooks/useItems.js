import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';

// ─── NORMALIZE SNAKE_CASE → CAMELCASE ───────────
function normalizeItem(i) {
  return {
    id: i.id,
    type: i.type,
    text: i.text,
    ref: i.ref,
    status: i.status,
    priority: i.priority,
    nextCheck: i.next_check,
    notes: i.notes,
    tags: i.tags || [],
    checkinLog: i.checkin_log || [],
    lastCheck: i.last_check,
    createdAt: i.created_at ? new Date(i.created_at).getTime() : Date.now(),
    updatedAt: i.updated_at ? new Date(i.updated_at).getTime() : Date.now(),
    user_id: i.user_id,
  };
}

// ─── CAMELCASE → SNAKE_CASE ─────────────────────
function denormalizeItem(i) {
  const out = {};
  if ('type' in i) out.type = i.type;
  if ('text' in i) out.text = i.text;
  if ('ref' in i) out.ref = i.ref;
  if ('status' in i) out.status = i.status;
  if ('priority' in i) out.priority = i.priority;
  if ('nextCheck' in i) out.next_check = i.nextCheck || null;
  if ('notes' in i) out.notes = i.notes;
  if ('tags' in i) out.tags = i.tags || [];
  if ('checkinLog' in i) out.checkin_log = i.checkinLog || [];
  if ('lastCheck' in i) out.last_check = i.lastCheck;
  return out;
}

export function useItems() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── FETCH ──────────────────────────────────────
  const fetchItems = useCallback(async () => {
    if (!currentUser) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setItems((data || []).map(normalizeItem));
      setError(null);
    } catch (err) {
      console.error('❌ fetchItems error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // ─── REALTIME ───────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    fetchItems();

    const channel = supabase
      .channel('items-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items' },
        (payload) => {
          console.log('🔄 Realtime item:', payload);
          if (payload.eventType === 'INSERT') {
            setItems(prev => [normalizeItem(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setItems(prev => prev.map(i => i.id === payload.new.id ? normalizeItem(payload.new) : i));
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(i => i.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser, fetchItems]);

  // ─── ADD ────────────────────────────────────────
  const addItem = useCallback(async (item) => {
    if (!currentUser) return null;

    const payload = {
      user_id: currentUser.id,
      ...denormalizeItem(item),
      checkin_log: [],
    };

    try {
      const { data, error: insertError } = await supabase
        .from('items')
        .insert(payload)
        .select()
        .single();

      if (insertError) throw insertError;

      const normalized = normalizeItem(data);
      setItems(prev => [normalized, ...prev.filter(i => i.id !== normalized.id)]);
      return normalized;
    } catch (err) {
      console.error('❌ addItem error:', err);
      setError(err.message);
      throw err;
    }
  }, [currentUser]);

  // ─── UPDATE ─────────────────────────────────────
  const updateItem = useCallback(async (id, updates) => {
    if (!currentUser) return;

    try {
      const { data, error: updateError } = await supabase
        .from('items')
        .update(denormalizeItem(updates))
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const normalized = normalizeItem(data);
      setItems(prev => prev.map(i => i.id === id ? normalized : i));
      return normalized;
    } catch (err) {
      console.error('❌ updateItem error:', err);
      setError(err.message);
      throw err;
    }
  }, [currentUser]);

  // ─── DELETE ─────────────────────────────────────
  const deleteItem = useCallback(async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('❌ deleteItem error:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // ─── CHECK-IN ───────────────────────────────────
  const addCheckin = useCallback(async (id, note, nextDate) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newCheckin = {
      time: Date.now(),
      note: note || '(no note)',
    };

    try {
      const { data, error: updateError } = await supabase
        .from('items')
        .update({
          checkin_log: [...(item.checkinLog || []), newCheckin],
          last_check: new Date().toISOString(),
          next_check: nextDate || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setItems(prev => prev.map(i => i.id === id ? normalizeItem(data) : i));
    } catch (err) {
      console.error('❌ addCheckin error:', err);
      setError(err.message);
    }
  }, [items]);

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    addItem,
    updateItem,
    deleteItem,
    addCheckin,
  };
}
