import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: 'Classroom Equipment', icon: '📽️', desc: 'Projectors, fans, lights, AC' },
  { value: 'Faculty Availability', icon: '👨‍🏫', desc: 'Absent faculty, schedule issues' },
  { value: 'Hostel Maintenance', icon: '🏠', desc: 'Room repairs, facilities' },
  { value: 'Water Supply & Sanitation', icon: '🚿', desc: 'Water, toilets, cleanliness' },
  { value: 'Exam Schedule Conflicts', icon: '📅', desc: 'Timetable clashes, exam issues' },
  { value: 'Harassment or Misbehavior', icon: '🔒', desc: 'Sensitive — stay anonymous' },
  { value: 'Others', icon: '📋', desc: 'Any other complaint' }
];

const PRIORITIES = [
  { value: 'Low', color: '#4caf50', desc: 'Not urgent, can wait' },
  { value: 'Medium', color: '#ff9800', desc: 'Needs attention soon' },
  { value: 'High', color: '#f44336', desc: 'Affects studies/safety' },
  { value: 'Critical', color: '#ff1744', desc: 'Immediate action required' }
];

const ComplaintForm = ({ onNavigate }) => {
  const { authFetch, user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    isAnonymous: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const handleCategorySelect = (cat) => {
    setForm(prev => ({ ...prev, category: cat }));
    setError('');
  };

  const handlePrioritySelect = (p) => {
    setForm(prev => ({ ...prev, priority: p }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) return setError('Please select a category.');
    if (form.title.trim().length < 5) return setError('Title must be at least 5 characters.');
    if (form.description.trim().length < 10) return setError('Description must be at least 10 characters.');

    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/complaints', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Complaint submitted successfully! You can track it in your dashboard.');
        setForm({ title: '', description: '', category: '', priority: 'Medium', isAnonymous: false });
        setTimeout(() => onNavigate('dashboard'), 2500);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div className="container">
        <div style={styles.pageHeader}>
          <div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('dashboard')} style={{ marginBottom: 12 }}>
              ← Back to Dashboard
            </button>
            <h1 style={styles.title}>Submit a Complaint</h1>
            <p style={styles.sub}>All complaints are handled with care. You can stay anonymous.</p>
          </div>
        </div>

        <div style={styles.formLayout}>
          {/* Main form */}
          <div style={styles.mainForm}>
            {error && <div className="error-msg">{error}</div>}
            {success && <div className="success-msg">✅ {success}</div>}

            <form onSubmit={handleSubmit}>
              {/* Category Selection */}
              <div style={styles.section}>
                <div className="form-label" style={{ marginBottom: 12 }}>SELECT CATEGORY *</div>
                <div style={styles.categoryGrid}>
                  {CATEGORIES.map(cat => (
                    <div
                      key={cat.value}
                      style={{
                        ...styles.categoryCard,
                        ...(form.category === cat.value ? styles.categoryCardActive : {})
                      }}
                      onClick={() => handleCategorySelect(cat.value)}
                    >
                      <span style={styles.categoryIcon}>{cat.icon}</span>
                      <div style={styles.categoryName}>{cat.value}</div>
                      <div style={styles.categoryDesc}>{cat.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="form-group" style={styles.section}>
                <label className="form-label">COMPLAINT TITLE *</label>
                <input
                  className="form-input"
                  type="text"
                  name="title"
                  placeholder="Brief title describing your complaint..."
                  value={form.title}
                  onChange={handleChange}
                  maxLength={100}
                  required
                />
                <div style={styles.charCount}>{form.title.length}/100</div>
              </div>

              {/* Description */}
              <div className="form-group" style={styles.section}>
                <label className="form-label">DETAILED DESCRIPTION *</label>
                <textarea
                  className="form-textarea"
                  name="description"
                  placeholder="Describe your complaint in detail. Include location, time, and any relevant details..."
                  value={form.description}
                  onChange={handleChange}
                  maxLength={1000}
                  rows={5}
                  required
                  style={{ minHeight: 140 }}
                />
                <div style={styles.charCount}>{form.description.length}/1000</div>
              </div>

              {/* Priority */}
              <div style={styles.section}>
                <div className="form-label" style={{ marginBottom: 12 }}>PRIORITY LEVEL *</div>
                <div style={styles.priorityRow}>
                  {PRIORITIES.map(p => (
                    <div
                      key={p.value}
                      style={{
                        ...styles.priorityCard,
                        borderColor: form.priority === p.value ? p.color : '#1e2d4a',
                        background: form.priority === p.value ? `${p.color}15` : 'transparent'
                      }}
                      onClick={() => handlePrioritySelect(p.value)}
                    >
                      <div style={{ ...styles.priorityDot, background: p.color }}></div>
                      <div style={{ ...styles.priorityLabel, color: form.priority === p.value ? p.color : '#e8eef8' }}>{p.value}</div>
                      <div style={styles.priorityDesc}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Anonymous toggle */}
              <div style={{ ...styles.section, ...styles.anonSection }}>
                <div style={styles.anonLeft}>
                  <div style={styles.anonTitle}>🔒 Submit Anonymously</div>
                  <div style={styles.anonDesc}>
                    Your identity will be completely hidden. Use for sensitive complaints like harassment.
                    {form.isAnonymous && (
                      <span style={styles.anonActive}> — Your name will NOT be visible to anyone.</span>
                    )}
                  </div>
                </div>
                <label style={styles.toggle}>
                  <input
                    type="checkbox"
                    name="isAnonymous"
                    checked={form.isAnonymous}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    ...styles.toggleTrack,
                    background: form.isAnonymous ? '#3b7eff' : '#1e2d4a'
                  }}>
                    <div style={{
                      ...styles.toggleThumb,
                      transform: form.isAnonymous ? 'translateX(22px)' : 'translateX(2px)'
                    }}></div>
                  </div>
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 8 }}
                disabled={loading}
              >
                {loading ? <><span className="spinner"></span> Submitting...</> : '📤 Submit Complaint'}
              </button>
            </form>
          </div>

          {/* Sidebar info */}
          <div style={styles.sidebar}>
            <div className="card">
              <h3 style={styles.sidebarTitle}>📌 How it works</h3>
              {[
                { step: '01', text: 'Fill the form and submit your complaint' },
                { step: '02', text: 'Admin reviews and assigns to department' },
                { step: '03', text: 'Get real-time notifications on updates' },
                { step: '04', text: 'Complaint resolved & closed' }
              ].map(item => (
                <div key={item.step} style={styles.stepItem}>
                  <span style={styles.stepNum}>{item.step}</span>
                  <span style={styles.stepText}>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h3 style={styles.sidebarTitle}>🔒 Privacy Policy</h3>
              <p style={styles.privacyText}>
                Anonymous complaints store your ID securely in our database for internal tracking,
                but your name and personal information are <strong style={{ color: '#e8eef8' }}>never shown</strong> to
                anyone — including admins.
              </p>
            </div>

            {/* Preview card */}
            {(form.title || form.category) && (
              <div className="card" style={{ marginTop: 16, borderColor: '#2a3d5e' }}>
                <h3 style={styles.sidebarTitle}>👁️ Preview</h3>
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Category</span>
                  <span style={styles.previewVal}>{form.category || '—'}</span>
                </div>
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Priority</span>
                  <span className={`badge badge-${form.priority.toLowerCase()}`}>{form.priority}</span>
                </div>
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Anonymous</span>
                  <span style={{ color: form.isAnonymous ? '#00e676' : '#4a5a72', fontSize: 12 }}>
                    {form.isAnonymous ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Submitted by</span>
                  <span style={{ fontSize: 12, color: form.isAnonymous ? '#4a5a72' : '#8096b4' }}>
                    {form.isAnonymous ? '🔒 Anonymous' : user?.name}
                  </span>
                </div>
              </div>
            )}
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
    paddingTop: 32,
    paddingBottom: 64,
    animation: 'pageEnter 0.3s ease forwards'
  },
  pageHeader: { marginBottom: 32 },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 32,
    color: '#e8eef8',
    marginBottom: 8
  },
  sub: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    color: '#4a5a72'
  },
  formLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: 24,
    alignItems: 'start'
  },
  mainForm: {
    background: '#141c2e',
    border: '1px solid #1e2d4a',
    borderRadius: 16,
    padding: 32
  },
  section: {
    marginBottom: 28
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 10
  },
  categoryCard: {
    padding: 16,
    border: '1px solid #1e2d4a',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'transparent',
    userSelect: 'none'
  },
  categoryCardActive: {
    borderColor: '#3b7eff',
    background: 'rgba(59, 126, 255, 0.1)'
  },
  categoryIcon: { fontSize: 22, display: 'block', marginBottom: 8 },
  categoryName: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    fontWeight: 700,
    color: '#e8eef8',
    marginBottom: 4,
    lineHeight: 1.3
  },
  categoryDesc: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: '#4a5a72',
    lineHeight: 1.3
  },
  charCount: {
    textAlign: 'right',
    fontSize: 11,
    color: '#4a5a72',
    marginTop: 4,
    fontFamily: "'Space Mono', monospace"
  },
  priorityRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 10
  },
  priorityCard: {
    padding: 12,
    border: '1px solid #1e2d4a',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
    userSelect: 'none'
  },
  priorityDot: {
    width: 8, height: 8,
    borderRadius: '50%',
    margin: '0 auto 8px'
  },
  priorityLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 4
  },
  priorityDesc: {
    fontSize: 10,
    color: '#4a5a72',
    fontFamily: "'Space Mono', monospace",
    lineHeight: 1.3
  },
  anonSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(59, 126, 255, 0.05)',
    border: '1px solid #1e2d4a',
    borderRadius: 10,
    padding: 18,
    gap: 16
  },
  anonLeft: { flex: 1 },
  anonTitle: {
    fontFamily: "'Space Mono', monospace",
    fontWeight: 700,
    fontSize: 13,
    color: '#e8eef8',
    marginBottom: 6
  },
  anonDesc: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    color: '#4a5a72',
    lineHeight: 1.5
  },
  anonActive: { color: '#00e676' },
  toggle: { cursor: 'pointer', flexShrink: 0 },
  toggleTrack: {
    width: 46,
    height: 24,
    borderRadius: 12,
    position: 'relative',
    transition: 'background 0.3s'
  },
  toggleThumb: {
    position: 'absolute',
    top: 2,
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#fff',
    transition: 'transform 0.3s',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
  },
  sidebar: {},
  sidebarTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    color: '#e8eef8',
    marginBottom: 16
  },
  stepItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14
  },
  stepNum: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    fontWeight: 700,
    color: '#3b7eff',
    background: 'rgba(59, 126, 255, 0.1)',
    padding: '2px 6px',
    borderRadius: 4,
    flexShrink: 0
  },
  stepText: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    color: '#8096b4',
    lineHeight: 1.5
  },
  privacyText: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    color: '#8096b4',
    lineHeight: 1.7
  },
  previewItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #1e2d4a'
  },
  previewLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    color: '#4a5a72',
    textTransform: 'uppercase',
    letterSpacing: '0.8px'
  },
  previewVal: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    color: '#8096b4'
  }
};

export default ComplaintForm;
