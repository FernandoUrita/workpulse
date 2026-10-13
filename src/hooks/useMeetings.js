import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';

// ─── NORMALIZE SNAKE_CASE → CAMELCASE ───────────
function normalizeMeeting(m) {
  return {
    id: m.id,
    title: m.title,
    date: m.date,
    time: m.time,
    type: m.type,
    platform: m.platform,
    location: m.location,
    link: m.link,
    anydeskId: m.anydesk_id,
    anydeskPassword: m.anydesk_password,
    teamviewerId: m.teamviewer_id,
    teamviewerPassword: m.teamviewer_password,
    attendees: m.attendees || [],
    agenda: m.agenda || [],
    completed: m.completed || false,
    mom: m.mom,
    createdAt: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
    updatedAt: m.updated_at ? new Date(m.updated_at).getTime() : Date.now(),
    user_id: m.user_id,
  };
}

// ─── CAMELCASE → SNAKE_CASE ─────────────────────
function denormalizeMeeting(m) {
  const out = {};
  if ('title' in m) out.title = m.title;
  if ('date' in m) out.date = m.date || null;
  if ('time' in m) out.time = m.time;
  if ('type' in m) out.type = m.type;
  if ('platform' in m) out.platform = m.platform;
  if ('location' in m) out.location = m.location;
  if ('link' in m) out.link = m.link;
  if ('anydeskId' in m) out.anydesk_id = m.anydeskId;
  if ('anydeskPassword' in m) out.anydesk_password = m.anydeskPassword;
  if ('teamviewerId' in m) out.teamviewer_id = m.teamviewerId;
  if ('teamviewerPassword' in m) out.teamviewer_password = m.teamviewerPassword;
  if ('attendees' in m) out.attendees = m.attendees || [];
  if ('agenda' in m) out.agenda = m.agenda || [];
  if ('completed' in m) out.completed = m.completed;
  if ('mom' in m) out.mom = m.mom;
  return out;
}

export function useMeetings() {
  const { currentUser } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── FETCH ──────────────────────────────────────
  const fetchMeetings = useCallback(async () => {
    if (!currentUser) {
      setMeetings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setMeetings((data || []).map(normalizeMeeting));
      setError(null);
    } catch (err) {
      console.error('❌ fetchMeetings error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // ─── REALTIME ───────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    fetchMeetings();

    const channel = supabase
      .channel('meetings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings' },
        (payload) => {
          console.log('🔄 Realtime meeting:', payload);
          if (payload.eventType === 'INSERT') {
            setMeetings(prev => [normalizeMeeting(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setMeetings(prev => prev.map(m => m.id === payload.new.id ? normalizeMeeting(payload.new) : m));
          } else if (payload.eventType === 'DELETE') {
            setMeetings(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser, fetchMeetings]);

  // ─── ADD ────────────────────────────────────────
  const addMeeting = useCallback(async (meeting) => {
    if (!currentUser) return null;

    const payload = {
      user_id: currentUser.id,
      ...denormalizeMeeting(meeting),
      completed: false,
      mom: null,
    };

    try {
      const { data, error: insertError } = await supabase
        .from('meetings')
        .insert(payload)
        .select()
        .single();

      if (insertError) throw insertError;

      const normalized = normalizeMeeting(data);
      setMeetings(prev => [normalized, ...prev.filter(m => m.id !== normalized.id)]);
      return normalized;
    } catch (err) {
      console.error('❌ addMeeting error:', err);
      setError(err.message);
      throw err;
    }
  }, [currentUser]);

  // ─── UPDATE ─────────────────────────────────────
  const updateMeeting = useCallback(async (id, updates) => {
    if (!currentUser) return;

    try {
      const { data, error: updateError } = await supabase
        .from('meetings')
        .update(denormalizeMeeting(updates))
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const normalized = normalizeMeeting(data);
      setMeetings(prev => prev.map(m => m.id === id ? normalized : m));
      return normalized;
    } catch (err) {
      console.error('❌ updateMeeting error:', err);
      setError(err.message);
      throw err;
    }
  }, [currentUser]);

  // ─── DELETE ─────────────────────────────────────
  const deleteMeeting = useCallback(async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setMeetings(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('❌ deleteMeeting error:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // ─── COMPLETE (with MOM) ────────────────────────
  const completeMeeting = useCallback(async (id, mom) => {
    try {
      const { data, error: updateError } = await supabase
        .from('meetings')
        .update({ completed: true, mom })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const normalized = normalizeMeeting(data);
      setMeetings(prev => prev.map(m => m.id === id ? normalized : m));
    } catch (err) {
      console.error('❌ completeMeeting error:', err);
      setError(err.message);
    }
  }, []);

  return {
    meetings,
    loading,
    error,
    refetch: fetchMeetings,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    completeMeeting,
  };
}
