import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('warning', 'Missing Fields', 'Please fill in all fields.');
      return;
    }
    const result = login(username.trim(), password.trim());
    if (result.success) {
      showToast('success', 'Welcome Back!', `Hello, ${username}!`);
      navigate('/dashboard');
    } else {
      showToast('error', 'Login Failed', result.error);
    }
  };

  return (
    <div className="auth-overlay" style={{ position: 'fixed' }}>
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-header">
            <div className="auth-logo">
              <i className="fas fa-heartbeat"></i>
              <h2>Work<span>Pulse</span></h2>
            </div>
            <p className="auth-subtitle">Manage your work efficiently</p>
          </div>

          <form className="auth-form active" onSubmit={handleSubmit}>
            <h3><i className="fas fa-sign-in-alt"></i> Welcome Back</h3>
            
            <div className="form-group">
              <label><i className="fas fa-user"></i> Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label><i className="fas fa-lock"></i> Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>

            <button type="submit" className="primary-btn full-width">
              <i className="fas fa-sign-in-alt"></i> Login
            </button>

            <p className="auth-switch">
              Don't have an account? <Link to="/register">Register here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
