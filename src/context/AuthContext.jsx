import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── FETCH PROFILE ──────────────────────────────
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setCurrentUser(null);
      } else {
        setCurrentUser({
          id: data.id,
          username: data.username,
          name: data.name,
          email: data.email,
          role: data.role,
          avatar_url: data.avatar_url,
        });
      }
    } catch (err) {
      console.error('fetchProfile error:', err);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ─── INITIAL SESSION ────────────────────────────
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setCurrentUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
