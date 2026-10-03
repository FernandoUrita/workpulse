import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('warning', 'Missing Fields', 'Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim().toLowerCase(), password);
    setSubmitting(false);

    if (result.success) {
      showToast('success', 'Welcome Back!', 'Signed in successfully.');
      navigate('/dashboard');
    } else {
      showToast('error', 'Login Failed', result.error || 'Invalid email or password.');
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
              <label><i className="fas fa-envelope"></i> Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                autoFocus
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label><i className="fas fa-lock"></i> Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={submitting}
              />
            </div>

            <button type="submit" className="primary-btn full-width" disabled={submitting}>
              {submitting ? (
                <><i className="fas fa-spinner fa-spin"></i> Signing in...</>
              ) : (
                <><i className="fas fa-sign-in-alt"></i> Login</>
              )}
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
