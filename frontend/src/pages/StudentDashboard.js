import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };

const getBadgeClass = (val, type) => {
  if (type === 'status') {
    const map = { 'Pending': 'badge-pending', 'In Progress': 'badge-progress', 'Resolved': 'badge-resolved' };
    return map[val] || 'badge-pending';
  }
  if (type === 'priority') {
    const map = { Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high', Critical: 'badge-critical' };
    return map[val] || 'badge-medium';
  }
};

const ComplaintCard = ({ complaint }) => {
  const [expanded, setExpanded] = useState(false);
  const isHighAlert = complaint.priority === 'Critical' || complaint.priority === 'High';

  return (
    <div style={{
      ...styles.complaintCard,
      ...(isHighAlert ? styles.complaintCardAlert : {}),
      borderLeftColor: {
        Critical: '#ff1744', High: '#f44336', Medium: '#ff9800', Low: '#4caf50'
      }[complaint.priority]
    }}>
      <div style={styles.cardTop}>
        <div style={styles.cardMeta}>
          <span style={styles.cardCategory}>{complaint.category}</span>
          {complaint.isAnonymous && (
            <span style={styles.anonTag}>🔒 Anonymous</span>
          )}
        </div>
        <div style={styles.cardBadges}>
          <span className={`badge ${getBadgeClass(complaint.priority, 'priority')}`}>{complaint.priority}</span>
          <span className={`badge ${getBadgeClass(complaint.status, 'status')}`}>{complaint.status}</span>
        </div>
      </div>

      <h3 style={styles.cardTitle}>{complaint.title}</h3>

      {expanded && (
        <div style={styles.expanded}>
          <p style={styles.cardDesc}>{complaint.description}</p>
          {complaint.assignedTo && complaint.assignedTo !== 'Unassigned' && (
            <div style={styles.assignedBox}>
              <span style={styles.assignedLabel}>Assigned to:</span>
              <span style={styles.assignedVal}>{complaint.assignedTo}</span>
            </div>
          )}
          {complaint.adminRemarks && (
            <div style={styles.remarksBox}>
              <span style={styles.remarksLabel}>Admin Remarks:</span>
              <p style={styles.remarksVal}>{complaint.adminRemarks}</p>
            </div>
          )}
          {complaint.statusHistory && complaint.statusHistory.length > 0 && (
            <div style={styles.timeline}>
              <div style={styles.timelineTitle}>Status Timeline</div>
              {complaint.statusHistory.map((h, i) => (
                <div key={i} style={styles.timelineItem}>
                  <div style={styles.timelineDot}></div>
                  <div>
                    <span style={styles.timelineStatus}>{h.status}</span>
                    <span style={styles.timelineRemark}> — {h.remark}</span>
                    <div style={styles.timelineDate}>
                      {new Date(h.changedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={styles.cardFooter}>
        <span style={styles.cardDate}>
          {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
          })}
        </span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Collapse ▲' : 'View Details ▼'}
        </button>
      </div>
    </div>
  );
};

const StudentDashboard = ({ onNavigate }) => {
  const { authFetch, user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '' });

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/complaints/my');
      const data = await res.json();
      if (data.success) setComplaints(data.complaints);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Re-fetch when window gets focus (after real-time update)
  useEffect(() => {
    window.addEventListener('focus', fetchComplaints);
    return () => window.removeEventListener('focus', fetchComplaints);
  }, [fetchComplaints]);

  const filtered = complaints.filter(c => {
    if (filter.status && c.status !== filter.status) return false;
    if (filter.priority && c.priority !== filter.priority) return false;
    return true;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length
  };

  return (
    <div style={styles.page}>
      <div className="container">
        {/* Header */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.title}>
              Welcome back, <span style={styles.nameHighlight}>{user?.name?.split(' ')[0]}</span>
            </h1>
            <p style={styles.sub}>Track and manage your submitted complaints</p>
          </div>
          <button className="btn btn-primary" onClick={() => onNavigate('submit')}>
            + New Complaint
          </button>
        </div>

        {/* Stats row */}
        <div className="grid-4" style={{ marginBottom: 32 }}>
          {[
            { label: 'Total Complaints', val: stats.total, color: '#3b7eff', icon: '📋' },
            { label: 'Pending', val: stats.pending, color: '#ffd600', icon: '⏳' },
            { label: 'In Progress', val: stats.inProgress, color: '#2979ff', icon: '🔄' },
            { label: 'Resolved', val: stats.resolved, color: '#00e676', icon: '✅' }
          ].map(s => (
            <div key={s.label} className="card" style={{ borderLeftColor: s.color, borderLeftWidth: 3, borderLeftStyle: 'solid' }}>
              <div style={styles.statIcon}>{s.icon}</div>
              <div style={{ ...styles.statVal, color: s.color }}>{s.val}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={styles.filtersRow}>
          <span style={styles.filterLabel}>Filter:</span>
          <select
            className="form-select"
            style={{ width: 160 }}
            value={filter.status}
            onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
          <select
            className="form-select"
            style={{ width: 160 }}
            value={filter.priority}
            onChange={e => setFilter(p => ({ ...p, priority: e.target.value }))}
          >
            <option value="">All Priorities</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={fetchComplaints}>🔄 Refresh</button>
          <span style={styles.resultCount}>{filtered.length} complaint(s)</span>
        </div>

        {/* Complaints list */}
        {loading ? (
          <div style={styles.loadingState}>
            <span className="spinner"></span>
            <span>Loading complaints...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <div style={styles.emptyTitle}>No complaints found</div>
            <div style={styles.emptySub}>
              {complaints.length === 0
                ? "You haven't submitted any complaints yet."
                : "No complaints match your current filters."
              }
            </div>
            {complaints.length === 0 && (
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => onNavigate('submit')}>
                Submit Your First Complaint
              </button>
            )}
          </div>
        ) : (
          <div style={styles.complaintsList}>
            {filtered.map(c => (
              <ComplaintCard key={c._id} complaint={c} />
            ))}
          </div>
        )}
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
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 32,
    color: '#e8eef8',
    marginBottom: 8
  },
  nameHighlight: { color: '#3b7eff' },
  sub: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    color: '#4a5a72'
  },
  statIcon: { fontSize: 22, marginBottom: 8 },
  statVal: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 36,
    lineHeight: 1,
    marginBottom: 6
  },
  statLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    color: '#4a5a72',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  filtersRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24
  },
  filterLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    color: '#4a5a72',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  resultCount: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    color: '#8096b4',
    marginLeft: 'auto'
  },
  complaintsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  complaintCard: {
    background: '#141c2e',
    border: '1px solid #1e2d4a',
    borderLeft: '3px solid transparent',
    borderRadius: 12,
    padding: 20,
    transition: 'all 0.2s'
  },
  complaintCardAlert: {
    background: 'rgba(244, 67, 54, 0.03)'
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  cardMeta: {
    display: 'flex',
    gap: 8,
    alignItems: 'center'
  },
  cardCategory: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    color: '#3b7eff',
    background: 'rgba(59, 126, 255, 0.1)',
    padding: '3px 8px',
    borderRadius: 4,
    letterSpacing: '0.5px'
  },
  anonTag: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: '#4a5a72',
    background: 'rgba(74, 90, 114, 0.1)',
    padding: '3px 8px',
    borderRadius: 4,
    letterSpacing: '0.5px'
  },
  cardBadges: {
    display: 'flex',
    gap: 6
  },
  cardTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    color: '#e8eef8',
    marginBottom: 12
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTop: '1px solid #1e2d4a'
  },
  cardDate: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    color: '#4a5a72'
  },
  expanded: {
    marginBottom: 12,
    animation: 'pageEnter 0.2s ease'
  },
  cardDesc: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    color: '#8096b4',
    lineHeight: 1.7,
    marginBottom: 16,
    padding: '12px 0',
    borderTop: '1px solid #1e2d4a'
  },
  assignedBox: {
    background: 'rgba(59, 126, 255, 0.06)',
    border: '1px solid rgba(59, 126, 255, 0.2)',
    borderRadius: 8,
    padding: '10px 14px',
    display: 'flex',
    gap: 8,
    marginBottom: 10,
    alignItems: 'center'
  },
  assignedLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    color: '#4a5a72',
    textTransform: 'uppercase',
    letterSpacing: '0.8px'
  },
  assignedVal: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    color: '#3b7eff'
  },
  remarksBox: {
    background: 'rgba(0, 230, 118, 0.05)',
    border: '1px solid rgba(0, 230, 118, 0.15)',
    borderRadius: 8,
    padding: '10px 14px',
    marginBottom: 10
  },
  remarksLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: '#4a5a72',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    display: 'block',
    marginBottom: 4
  },
  remarksVal: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    color: '#00e676',
    lineHeight: 1.5
  },
  timeline: {
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    padding: '12px 14px',
    marginTop: 10
  },
  timelineTitle: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: '#4a5a72',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: 12
  },
  timelineItem: {
    display: 'flex',
    gap: 12,
    marginBottom: 10
  },
  timelineDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#3b7eff',
    flexShrink: 0,
    marginTop: 4
  },
  timelineStatus: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    fontWeight: 700,
    color: '#e8eef8'
  },
  timelineRemark: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    color: '#8096b4'
  },
  timelineDate: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: '#4a5a72',
    marginTop: 3
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 80,
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    color: '#4a5a72'
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 24px',
    background: '#141c2e',
    border: '1px dashed #1e2d4a',
    borderRadius: 16
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 20,
    color: '#e8eef8',
    marginBottom: 8
  },
  emptySub: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    color: '#4a5a72'
  }
};

export default StudentDashboard;
