import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { disablePush } from '../pwa/push.js';
import { supabase } from '../lib/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileRequest = useRef(0);
  const mounted = useRef(true);

  // ─── FETCH PROFILE ──────────────────────────────
  const fetchProfile = async (userId) => {
    const request = ++profileRequest.current;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!mounted.current || request !== profileRequest.current) return;
      if (error) {
        console.error('Error fetching profile:', error);
        setCurrentUser(null);
      } else if (data.is_active === false) {
        setCurrentUser(null);
        await supabase.auth.signOut();
      } else {
        const nextUser = {
          id: data.id,
          username: data.username,
          name: data.name,
          email: data.email,
          role: data.role,
          avatar_url: data.avatar_url,
        };
        // Preserve identity during unchanged access checks so data hooks do not reload.
        setCurrentUser(previous => previous && Object.keys(nextUser).every(key => previous[key] === nextUser[key]) ? previous : nextUser);
      }
    } catch (err) {
      console.error('fetchProfile error:', err);
      if (mounted.current && request === profileRequest.current) setCurrentUser(null);
    } finally {
      if (mounted.current && request === profileRequest.current) setLoading(false);
    }
  };

  // ─── INITIAL SESSION ────────────────────────────
  useEffect(() => {
    mounted.current = true;
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else if (mounted.current) {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setTimeout(() => { if (mounted.current) void fetchProfile(session.user.id); }, 0);
        } else {
          profileRequest.current++;
          setCurrentUser(null);
          setLoading(false);
        }
      }
    );

    // Refresh access on focus and every 30 seconds; database RLS applies immediately.
    const refreshAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await fetchProfile(session.user.id);
    };
    const interval = setInterval(refreshAccess, 30000);
    window.addEventListener('focus', refreshAccess);
    // Request counter invalidates asynchronous responses, not a DOM ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { mounted.current = false; profileRequest.current++; subscription.unsubscribe(); clearInterval(interval); window.removeEventListener('focus', refreshAccess); };
  }, []);

  // ─── LOGIN ──────────────────────────────────────
  const login = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ─── REGISTER ───────────────────────────────────
  const register = async (name, username, email, password) => {
    try {
      // Check if username exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Username already exists' };
      }

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            name,
            role: 'employee', // default role
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ─── LOGOUT ─────────────────────────────────────
  const logout = async () => {
    try {
      if (currentUser && 'serviceWorker' in navigator) {
        try { await disablePush(currentUser.id); }
        catch {
          const registration = await navigator.serviceWorker.getRegistration();
          const subscription = await registration?.pushManager?.getSubscription();
          await subscription?.unsubscribe();
        }
      }
      await supabase.auth.signOut();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // ─── UPDATE PROFILE ─────────────────────────────
  const updateProfile = async (name, email) => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name, email, updated_at: new Date().toISOString() })
        .eq('id', currentUser.id);

      if (error) {
        return { success: false, error: error.message };
      }

      setCurrentUser(prev => ({ ...prev, name, email }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      login,
      register,
      logout,
      updateProfile,
      isAuthenticated: !!currentUser,
      isAdmin: currentUser?.role === 'admin',
      isHead: currentUser?.role === 'head',
      isEmployee: currentUser?.role === 'employee',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Shared context hook intentionally lives beside its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
