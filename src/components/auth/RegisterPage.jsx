import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirm: '',
  });
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, username, email, password, confirm } = formData;

    if (!name || !username || !email || !password || !confirm) {
      showToast('warning', 'Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      showToast('warning', 'Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      showToast('warning', 'Password Mismatch', 'Passwords do not match.');
      return;
    }

    const result = register(name, username, email, password);
    if (result.success) {
      showToast('success', 'Account Created!', 'Please login with your credentials.');
      navigate('/login');
    } else {
      showToast('error', 'Registration Failed', result.error);
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
            <p className="auth-subtitle">Create your account</p>
          </div>

          <form className="auth-form active" onSubmit={handleSubmit}>
            <h3><i className="fas fa-user-plus"></i> Create Account</h3>

            <div className="form-group">
              <label><i className="fas fa-user"></i> Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label><i className="fas fa-user-tag"></i> Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose username"
              />
            </div>

            <div className="form-group">
              <label><i className="fas fa-envelope"></i> Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
              />
            </div>

            <div className="form-group">
              <label><i className="fas fa-lock"></i> Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create password (min 6 chars)"
              />
            </div>

            <div className="form-group">
              <label><i className="fas fa-lock"></i> Confirm Password</label>
              <input
                type="password"
                name="confirm"
                value={formData.confirm}
                onChange={handleChange}
                placeholder="Confirm password"
              />
            </div>

            <button type="submit" className="primary-btn full-width">
              <i className="fas fa-user-plus"></i> Register
            </button>

            <p className="auth-switch">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
