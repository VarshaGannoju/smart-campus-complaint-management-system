import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import ComplaintForm from './pages/ComplaintForm';
import AdminDashboard from './pages/AdminDashboard';
import './styles/global.css';

// Toast notification layer
const ToastLayer = () => {
  const { notifications, dismissNotification } = useSocket();
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="toast-container">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`toast toast-${n.type}`}
          onClick={() => dismissNotification(n.id)}
        >
          <div className="toast-title">{n.title}</div>
          <div className="toast-message">{n.message}</div>
        </div>
      ))}
    </div>
  );
};

// Inner app that has access to auth context
const AppInner = () => {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('login');

  // Auto-navigate after login
  React.useEffect(() => {
    if (user) {
      setPage(user.role === 'student' ? 'dashboard' : 'admin');
    } else if (!loading) {
      setPage('login');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        background: '#0a0e1a'
      }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }}></span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: '#4a5a72' }}>
          Loading SmartCampus...
        </span>
      </div>
    );
  }

  if (!user) {
    return page === 'register'
      ? <Register onNavigate={setPage} />
      : <Login onNavigate={setPage} />;
  }

  return (
    <SocketProvider>
      <div style={{ minHeight: '100vh', background: '#0a0e1a' }}>
        <Navbar currentPage={page} onNavigate={setPage} />
        <main>
          {(user.role === 'admin' || user.role === 'department') && <AdminDashboard />}
          {user.role === 'student' && page === 'submit' && <ComplaintForm onNavigate={setPage} />}
          {user.role === 'student' && page !== 'submit' && <StudentDashboard onNavigate={setPage} />}
        </main>
        <ToastLayer />
      </div>
    </SocketProvider>
  );
};

const App = () => (
  <AuthProvider>
    <AppInner />
  </AuthProvider>
);

export default App;
