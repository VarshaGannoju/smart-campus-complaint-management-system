import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
const SOCKET_URL = (() => {
  if (process.env.REACT_APP_SOCKET_URL) return process.env.REACT_APP_SOCKET_URL;
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;

  // In local CRA dev, use the same host as the opened page and backend port 5000.
  // This works for both desktop (localhost) and phone-over-LAN (192.168.x.x).
  if (process.env.NODE_ENV !== 'production') {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol || 'http:';
      const host = window.location.hostname || 'localhost';
      return `${protocol}//${host}:5000`;
    }
    return 'http://localhost:5000';
  }

  // In production single-domain setup, socket should use same origin.
  if (typeof window !== 'undefined') return window.location.origin;

  return 'http://localhost:5000';
})();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);

      if (user.role === 'student') {
        socket.emit('join_user_room', user._id);
      } else if (user.role === 'admin' || user.role === 'department') {
        socket.emit('join_admin_room');
      }
    });

    socket.on('complaint_updated', (data) => {
      addNotification({
        type: 'info',
        title: 'Status Updated',
        message: data.message || `Status changed to ${data.newStatus || 'updated'}`
      });
    });

    socket.on('priority_updated', (data) => {
      addNotification({
        type: 'warning',
        title: 'Priority Changed',
        message: data.message || `Priority updated to ${data.priority || 'new value'}`
      });
    });

    socket.on('complaint_assigned', (data) => {
      addNotification({
        type: 'success',
        title: 'Complaint Assigned',
        message: data.message || `Assigned to ${data.assignedTo || 'department'}`
      });
    });

    socket.on('new_complaint', (data) => {
      addNotification({
        type: 'info',
        title: 'New Complaint',
        message: data.message
      });
    });

    socket.on('complaint_status_changed', (data) => {
      addNotification({
        type: 'success',
        title: 'Status Changed',
        message: `Complaint status updated to "${data.newStatus}" by ${data.updatedBy}`
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [{ ...notification, id }, ...prev].slice(0, 10));
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, notifications, dismissNotification }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be inside SocketProvider');
  return ctx;
};
