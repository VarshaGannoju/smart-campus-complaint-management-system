import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Navbar = ({ currentPage, onNavigate }) => {
  const { user, logout } = useAuth();
  const { notifications } = useSocket();
  const [showNotifs, setShowNotifs] = useState(false);

  const unread = notifications.length;

  return (
    <nav style={styles.nav}>
      <div style={styles.navInner}>
        {/* Logo */}
        <div style={styles.logo} onClick={() => onNavigate(user?.role === 'student' ? 'dashboard' : 'admin')}>
          <div style={styles.logoIcon}>⚡</div>
          <div>
            <div style={styles.logoTitle}>SmartCampus</div>
            <div style={styles.logoSub}>Complaint System</div>
          </div>
        </div>

        {/* Nav links */}
        <div style={styles.links}>
          {user?.role === 'student' && (
            <>
              <NavLink label="Dashboard" page="dashboard" current={currentPage} onNavigate={onNavigate} />
              <NavLink label="New Complaint" page="submit" current={currentPage} onNavigate={onNavigate} />
            </>
          )}
          {(user?.role === 'admin' || user?.role === 'department') && (
            <NavLink label="Admin Panel" page="admin" current={currentPage} onNavigate={onNavigate} />
          )}
        </div>

        {/* Right side */}
        <div style={styles.rightSection}>
          {/* Notification bell */}
          <div style={{ position: 'relative' }}>
            <button
              style={{ ...styles.iconBtn, ...(showNotifs ? styles.iconBtnActive : {}) }}
              onClick={() => setShowNotifs(!showNotifs)}
            >
              🔔
              {unread > 0 && (
                <span style={styles.badge}>{unread}</span>
              )}
            </button>

            {showNotifs && (
              <div style={styles.notifDropdown}>
                <div style={styles.notifHeader}>
                  <span style={styles.notifTitle}>Notifications</span>
                  <span style={styles.notifCount}>{unread} new</span>
                </div>
                {notifications.length === 0 ? (
                  <div style={styles.noNotif}>No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{ ...styles.notifItem, ...styles[`notif_${n.type}`] }}>
                      <div style={styles.notifItemTitle}>{n.title}</div>
                      <div style={styles.notifItemMsg}>{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User info */}
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>{user?.name?.[0]?.toUpperCase()}</div>
            <div style={styles.userMeta}>
              <div style={styles.userName}>{user?.name}</div>
              <div style={styles.userRole}>{user?.role}</div>
            </div>
          </div>

          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ label, page, current, onNavigate }) => (
  <button
    style={{
      ...styles.navLink,
      ...(current === page ? styles.navLinkActive : {})
    }}
    onClick={() => onNavigate(page)}
  >
    {label}
  </button>
);

const styles = {
  nav: {
    background: 'rgba(10, 14, 26, 0.95)',
    borderBottom: '1px solid #1e2d4a',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navInner: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 24px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
    userSelect: 'none'
  },
  logoIcon: {
    fontSize: 24,
    background: 'linear-gradient(135deg, #3b7eff, #00d4ff)',
    borderRadius: 8,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 16,
    color: '#e8eef8',
    lineHeight: 1.2
  },
  logoSub: {
    fontSize: 10,
    color: '#4a5a72',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    fontFamily: "'Space Mono', monospace"
  },
  links: {
    display: 'flex',
    gap: 4,
    flex: 1,
    marginLeft: 24
  },
  navLink: {
    background: 'transparent',
    border: 'none',
    color: '#8096b4',
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    padding: '8px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: 400,
    letterSpacing: '0.3px'
  },
  navLinkActive: {
    background: 'rgba(59, 126, 255, 0.15)',
    color: '#3b7eff',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 16
  },
  iconBtn: {
    background: 'transparent',
    border: '1px solid #1e2d4a',
    borderRadius: 8,
    width: 38,
    height: 38,
    cursor: 'pointer',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: 'all 0.2s'
  },
  iconBtnActive: {
    borderColor: '#3b7eff',
    background: 'rgba(59, 126, 255, 0.1)'
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    background: '#ff3d57',
    color: '#fff',
    fontSize: 9,
    fontWeight: 700,
    width: 16,
    height: 16,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  notifDropdown: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    width: 340,
    background: '#141c2e',
    border: '1px solid #1e2d4a',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    overflow: 'hidden',
    zIndex: 200
  },
  notifHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #1e2d4a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  notifTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    color: '#e8eef8'
  },
  notifCount: {
    fontSize: 11,
    color: '#3b7eff',
    background: 'rgba(59, 126, 255, 0.15)',
    padding: '2px 8px',
    borderRadius: 20
  },
  noNotif: {
    padding: 24,
    textAlign: 'center',
    color: '#4a5a72',
    fontSize: 13
  },
  notifItem: {
    padding: '12px 16px',
    borderBottom: '1px solid #1e2d4a',
    borderLeft: '3px solid transparent',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  notif_info: { borderLeftColor: '#3b7eff' },
  notif_success: { borderLeftColor: '#00e676' },
  notif_warning: { borderLeftColor: '#ff9100' },
  notif_error: { borderLeftColor: '#ff3d57' },
  notifItemTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#e8eef8',
    marginBottom: 4
  },
  notifItemMsg: {
    fontSize: 11,
    color: '#8096b4',
    lineHeight: 1.4
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b7eff, #9c6eff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 14,
    color: '#fff'
  },
  userMeta: {
    display: 'flex',
    flexDirection: 'column'
  },
  userName: {
    fontSize: 13,
    fontWeight: 700,
    color: '#e8eef8',
    fontFamily: "'Syne', sans-serif",
    lineHeight: 1.2
  },
  userRole: {
    fontSize: 10,
    color: '#4a5a72',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid #1e2d4a',
    color: '#8096b4',
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    padding: '7px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export default Navbar;
