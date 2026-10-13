import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * useAllData — fetches ALL data across all users.
 * ONLY for head/admin roles. RLS policies enforce this server-side.
 */
export function useAllData() {
  const { currentUser } = useAuth();
  const [data, setData] = useState({
    tasks: [],
    tickets: [],
    meetings: [],
    items: [],
    profiles: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!currentUser || !['head', 'admin'].includes(currentUser.role)) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [tasksRes, ticketsRes, meetingsRes, itemsRes, profilesRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('tickets').select('*').order('created_at', { ascending: false }),
        supabase.from('meetings').select('*').order('created_at', { ascending: false }),
        supabase.from('items').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, username, name, role').order('name'),
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (ticketsRes.error) throw ticketsRes.error;
      if (meetingsRes.error) throw meetingsRes.error;
      if (itemsRes.error) throw itemsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      setData({
        tasks: tasksRes.data || [],
        tickets: ticketsRes.data || [],
        meetings: meetingsRes.data || [],
        items: itemsRes.data || [],
        profiles: profilesRes.data || [],
      });
      setError(null);
    } catch (err) {
      console.error('❌ fetchAll error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    ...data,
    loading,
    error,
    refetch: fetchAll,
  };
}
