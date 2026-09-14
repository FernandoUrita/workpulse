import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const USERS_KEY = 'workpulse_users';
const CURRENT_USER_KEY = 'workpulse_current_user';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const savedUsers = localStorage.getItem(USERS_KEY);
    let loadedUsers = [];
    if (savedUsers) {
      try { loadedUsers = JSON.parse(savedUsers); } catch (e) { loadedUsers = []; }
    }
    if (loadedUsers.length === 0) {
      loadedUsers = [{
        name: 'Admin',
        username: 'admin',
        email: 'admin@workpulse.com',
        password: 'admin123'
      }];
      localStorage.setItem(USERS_KEY, JSON.stringify(loadedUsers));
    }
    setUsers(loadedUsers);

    const savedCurrent = localStorage.getItem(CURRENT_USER_KEY);
    if (savedCurrent) {
      try { setCurrentUser(JSON.parse(savedCurrent)); } catch (e) {}
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return { success: true };
    }
    return { success: false, error: 'Invalid username or password' };
  };

  const register = (name, username, email, password) => {
    if (users.find(u => u.username === username)) {
      return { success: false, error: 'Username already exists' };
    }
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered' };
    }
    const newUser = { name, username, email, password };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const updateProfile = (name, email) => {
    const updatedUsers = users.map(u => 
      u.username === currentUser.username ? { ...u, name, email } : u
    );
    const updatedCurrent = { ...currentUser, name, email };
    setUsers(updatedUsers);
    setCurrentUser(updatedCurrent);
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurrent));
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
