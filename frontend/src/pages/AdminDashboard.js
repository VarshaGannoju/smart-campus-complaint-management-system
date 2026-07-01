import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['Unassigned', 'Maintenance', 'Hostel', 'Academic', 'Examination', 'Student Affairs'];
const STATUSES = ['Pending', 'In Progress', 'Resolved'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const AdminDashboard = () => {
  const { user, authFetch } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isDepartment = user?.role === 'department';
  const canUpdateStatus = isAdmin || isDepartment;

  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', priority: '', status: '', sortBy: 'latest' });
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [actionForm, setActionForm] = useState({ status: '', priority: '', assignedTo: '', remark: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchComplaints = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.status) params.set('status', filters.status);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);

      const res = await authFetch(`/api/admin/complaints?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setComplaints(Array.isArray(data.complaints) ? data.complaints : []);
      }
    } catch (err) {
      console.error('Fetch complaints error:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch, filters, user]);

  const fetchStats = useCallback(async () => {
    if (!isAdmin) {
      setStats(null);
      return;
    }

    try {
      const res = await authFetch('/api/admin/stats');
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  }, [authFetch, isAdmin]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const categories = useMemo(
    () => [
      'Classroom Equipment',
      'Faculty Availability',
      'Hostel Maintenance',
      'Water Supply & Sanitation',
      'Exam Schedule Conflicts',
      'Harassment or Misbehavior',
      'Others'
    ],
    []
  );

  const openComplaint = (complaint) => {
    setActiveComplaint(complaint);
    setActionForm({
      status: complaint.status,
      priority: complaint.priority,
      assignedTo: complaint.assignedTo || 'Unassigned',
      remark: ''
    });
    setActionMsg('');
  };

  const handleAction = async (type) => {
    if (!activeComplaint) return;
    if (type === 'status' && !canUpdateStatus) return;
    if ((type === 'priority' || type === 'assign') && !isAdmin) return;

    setActionLoading(true);
    setActionMsg('');

    try {
      let url = `/api/admin/complaints/${activeComplaint._id}`;
      let body = {};

      if (type === 'status') {
        url += '/status';
        body = { status: actionForm.status, remark: actionForm.remark };
      } else if (type === 'priority') {
        url += '/priority';
        body = { priority: actionForm.priority };
      } else if (type === 'assign') {
        url += '/assign';
        body = { assignedTo: actionForm.assignedTo };
      }

      const res = await authFetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setActionMsg(`SUCCESS: ${data.message}`);
        setComplaints((prev) => prev.map((c) => (c._id === activeComplaint._id ? { ...c, ...data.complaint } : c)));
        setActiveComplaint((prev) => ({ ...prev, ...data.complaint }));
        fetchStats();
      } else {
        setActionMsg(`ERROR: ${data.message || 'Action failed.'}`);
      }
    } catch (err) {
      console.error('Action error:', err);
      setActionMsg('ERROR: Network error.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) {
    return <div style={{ color: '#fff', padding: 40 }}>Loading user...</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>{isAdmin ? 'Admin Dashboard' : 'Department Dashboard'}</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => { fetchComplaints(); fetchStats(); }}>
          Refresh
        </button>
      </div>

      {stats && (
        <div className="grid-4" style={{ marginBottom: 16 }}>
          <div className="card">Total: {stats.total}</div>
          <div className="card">Pending: {stats.pending}</div>
          <div className="card">In Progress: {stats.inProgress}</div>
          <div className="card">Resolved: {stats.resolved}</div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid-4">
          <select className="form-select" value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}>
            <option value="">All Categories</option>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
          <select className="form-select" value={filters.priority} onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}>
            <option value="">All Priorities</option>
            {PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
          </select>
          <select className="form-select" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
            <option value="">All Statuses</option>
            {STATUSES.map((status) => <option key={status}>{status}</option>)}
          </select>
          <select className="form-select" value={filters.sortBy} onChange={(e) => setFilters((p) => ({ ...p, sortBy: e.target.value }))}>
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority_desc">Priority High to Low</option>
            <option value="priority_asc">Priority Low to High</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ maxHeight: 560, overflow: 'auto' }}>
          {loading && <div>Loading complaints...</div>}
          {!loading && complaints.length === 0 && <div>No complaints found.</div>}
          {!loading && complaints.map((complaint) => (
            <div key={complaint._id} style={{ border: '1px solid #1e2d4a', borderRadius: 8, padding: 12, marginBottom: 8, cursor: 'pointer' }} onClick={() => openComplaint(complaint)}>
              <div><strong>{complaint.title}</strong></div>
              <div>{complaint.category}</div>
              <div>{complaint.priority} | {complaint.status}</div>
              <div>{new Date(complaint.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="card">
          {!activeComplaint && <div>Select a complaint to view details.</div>}
          {activeComplaint && (
            <>
              <h3>{activeComplaint.title}</h3>
              <p>{activeComplaint.description}</p>
              <p>Category: {activeComplaint.category}</p>
              <p>Priority: {activeComplaint.priority}</p>
              <p>Status: {activeComplaint.status}</p>
              <p>Assigned To: {activeComplaint.assignedTo || 'Unassigned'}</p>
              <p>Submitted By: {activeComplaint.isAnonymous ? 'Anonymous' : (activeComplaint.submittedBy?.name || 'Unknown')}</p>

              {actionMsg && (
                <div className={actionMsg.startsWith('SUCCESS:') ? 'success-msg' : 'error-msg'}>{actionMsg}</div>
              )}

              {canUpdateStatus && (
                <>
                  <div style={{ marginTop: 12 }}>
                    <label>Status</label>
                    <select className="form-select" value={actionForm.status} onChange={(e) => setActionForm((p) => ({ ...p, status: e.target.value }))}>
                      {STATUSES.map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <input className="form-input" placeholder="Remark (optional)" value={actionForm.remark} onChange={(e) => setActionForm((p) => ({ ...p, remark: e.target.value }))} />
                    <button className="btn btn-primary btn-sm" disabled={actionLoading} onClick={() => handleAction('status')}>Update Status</button>
                  </div>
                </>
              )}

              {isAdmin && (
                <>
                  <div style={{ marginTop: 12 }}>
                    <label>Priority</label>
                    <select className="form-select" value={actionForm.priority} onChange={(e) => setActionForm((p) => ({ ...p, priority: e.target.value }))}>
                      {PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
                    </select>
                    <button className="btn btn-secondary btn-sm" disabled={actionLoading} onClick={() => handleAction('priority')}>Update Priority</button>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label>Assign Department</label>
                    <select className="form-select" value={actionForm.assignedTo} onChange={(e) => setActionForm((p) => ({ ...p, assignedTo: e.target.value }))}>
                      {DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}
                    </select>
                    <button className="btn btn-ghost btn-sm" disabled={actionLoading} onClick={() => handleAction('assign')}>Assign</button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
