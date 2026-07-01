import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../config/api';

const ROLL_NUMBER_REGEX = /^(2[2-9]|[3-9]\d)[A-Z0-9]{8}$/;

const Register = ({ onNavigate }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rollNumber: '',
    department: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const departments = [
    'Computer Science', 'Electronics & Communication', 'Mechanical Engineering',
    'Civil Engineering', 'Electrical Engineering', 'Information Technology',
    'Chemical Engineering', 'Biotechnology', 'MBA', 'MCA', 'Other'
  ];

  const normalizeRollNumber = (value) => value.toUpperCase().replace(/\s+/g, '');
  const normalizeEmail = (value) => value.trim().toLowerCase().replace(/\s+/g, '');
  const normalizeCollegeEmail = (value) => {
    const normalizedValue = normalizeEmail(value);

    if (!normalizedValue) {
      return '';
    }

    if (!normalizedValue.includes('@') && normalizedValue.endsWith('cvr.ac.in')) {
      const localPart = normalizedValue.slice(0, -'cvr.ac.in'.length);
      return `${localPart}@cvr.ac.in`;
    }

    if (!normalizedValue.includes('@') && ROLL_NUMBER_REGEX.test(normalizedValue.toUpperCase())) {
      return `${normalizedValue}@cvr.ac.in`;
    }

    return normalizedValue;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'rollNumber'
        ? normalizeRollNumber(value)
        : name === 'email'
          ? normalizeCollegeEmail(value)
          : value
    }));
    setError('');
  };

  const validateCollegeIdentity = () => {
    const normalizedRollNumber = normalizeRollNumber(form.rollNumber);
    const normalizedEmail = normalizeEmail(form.email);

    if (!normalizedRollNumber || !normalizedEmail) {
      return 'College email and roll number are required.';
    }

    if (!ROLL_NUMBER_REGEX.test(normalizedRollNumber)) {
      return 'Roll number must look like 24B81A67Q9 and batch should be 22 or later.';
    }

    if (!normalizedEmail.endsWith('@cvr.ac.in')) {
      return 'Use your college Outlook email ending with @cvr.ac.in.';
    }

    const localPart = normalizedEmail.split('@')[0] || '';
    if (localPart.toUpperCase() !== normalizedRollNumber) {
      return 'Email must match your roll number exactly.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const identityError = validateCollegeIdentity();
    if (identityError) {
      return setError(identityError);
    }
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(buildApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: normalizeEmail(form.email),
          password: form.password,
          rollNumber: normalizeRollNumber(form.rollNumber),
          department: form.department
        })
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
            : `Registration failed (HTTP ${res.status}).`;
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
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.backBtn} onClick={() => onNavigate('login')}>← Back to Login</div>
          <div style={styles.logo}>⚡ SmartCampus CMS</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.title}>Create Account</h2>
            <p style={styles.sub}>Register as a student to submit complaints</p>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  className="form-input"
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <input
                  className="form-input"
                  type="text"
                  name="rollNumber"
                  placeholder="24B81A67XX"
                  value={form.rollNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                className="form-input"
                type="email"
                name="email"
                placeholder="24b81a67q9@cvr.ac.in"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                name="department"
                value={form.department}
                onChange={handleChange}
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  className="form-input"
                  type="password"
                  name="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  className="form-input"
                  type="password"
                  name="confirmPassword"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? <><span className="spinner"></span> Creating account...</> : 'Create Account →'}
            </button>
          </form>

          <div style={styles.loginLink}>
            Already have an account?{' '}
            <span style={styles.link} onClick={() => onNavigate('login')}>Sign in</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0e1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px'
  },
  container: { width: '100%', maxWidth: 640 },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32
  },
  backBtn: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    color: '#8096b4',
    cursor: 'pointer',
    transition: 'color 0.2s'
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 16,
    color: '#3b7eff'
  },
  card: {
    background: '#141c2e',
    border: '1px solid #1e2d4a',
    borderRadius: 16,
    padding: 40
  },
  cardHeader: { marginBottom: 32 },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 28,
    color: '#e8eef8',
    marginBottom: 8
  },
  sub: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    color: '#4a5a72'
  },
  loginLink: {
    marginTop: 24,
    textAlign: 'center',
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    color: '#8096b4'
  },
  link: {
    color: '#3b7eff',
    cursor: 'pointer',
    textDecoration: 'underline'
  }
};

export default Register;
