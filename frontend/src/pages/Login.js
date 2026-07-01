import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../config/api';

const Login = ({ onNavigate }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      let data = null;
      let text = '';
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        text = await res.text();
      }

      if (res.ok && data?.success) {
        login(data.user, data.token);
      } else {
        const fallback =
          text && text.includes('<!doctype html')
            ? `Backend API route not found (HTTP ${res.status}). Please check backend server/proxy.`
            : `Login failed (HTTP ${res.status}).`;
        setError(data?.message || fallback);
      }
    } catch {
      setError('Cannot reach server. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Left panel */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.heroIcon}>⚡</div>
          <h1 style={styles.heroTitle}>Smart Campus<br />CMS</h1>
          <p style={styles.heroSub}>Complaint Management System</p>
          <div style={styles.gridBg}></div>
        </div>
      </div>

      {/* Right panel - form */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Sign In</h2>
            <p style={styles.formSub}>Access your complaint portal</p>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                name="email"
                placeholder="you@campus.edu"
                value={form.email}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? <><span className="spinner"></span> Signing in...</> : 'Sign In →'}
            </button>
          </form>

          <div style={styles.divider}><span>or</span></div>

          <button
            className="btn btn-ghost"
            style={{ width: '100%' }}
            onClick={() => onNavigate('register')}
          >
            Create new account
          </button>

        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
  },
  leftPanel: {
    flex: 1,
    background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1526 50%, #091222 100%)',
    borderRight: '1px solid #1e2d4a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    position: 'relative',
    overflow: 'hidden',
  },
  leftContent: {
    position: 'relative',
    zIndex: 2,
    maxWidth: 400
  },
  heroIcon: {
    fontSize: 48,
    marginBottom: 24,
    display: 'block',
    background: 'linear-gradient(135deg, #3b7eff, #00d4ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  heroTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 52,
    lineHeight: 1.1,
    color: '#e8eef8',
    marginBottom: 16,
    letterSpacing: '-1px'
  },
  heroSub: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    color: '#4a5a72',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginBottom: 40,
    paddingBottom: 40,
    borderBottom: '1px solid #1e2d4a'
  },
  gridBg: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(30, 45, 74, 0.3) 1px, transparent 1px),
      linear-gradient(90deg, rgba(30, 45, 74, 0.3) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    zIndex: 1,
    pointerEvents: 'none'
  },
  rightPanel: {
    width: 480,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    background: '#0a0e1a'
  },
  formCard: {
    width: '100%',
    maxWidth: 380
  },
  formHeader: {
    marginBottom: 32
  },
  formTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 32,
    color: '#e8eef8',
    marginBottom: 8
  },
  formSub: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    color: '#4a5a72',
    letterSpacing: '0.5px'
  },
  divider: {
    textAlign: 'center',
    position: 'relative',
    margin: '20px 0',
    color: '#4a5a72',
    fontSize: 12,
    fontFamily: "'Space Mono', monospace"
  }
};

export default Login;
