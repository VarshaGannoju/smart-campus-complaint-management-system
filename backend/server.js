const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);
const configuredOrigins = process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';
const normalizeOrigin = (value = '') => String(value).trim().replace(/\/+$/, '').toLowerCase();
const allowedOrigins = configuredOrigins
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === 'production';

const corsOrigin = (origin, callback) => {
  // Allow non-browser tools (curl/postman) with no Origin header.
  if (!origin) return callback(null, true);
  const normalizedOrigin = normalizeOrigin(origin);

  // In local development, allow all origins to simplify testing across devices.
  if (!isProduction) {
    return callback(null, true);
  }

  // Always allow localhost/127.0.0.1 (useful for local testing even if NODE_ENV=production).
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedOrigin)) {
    return callback(null, true);
  }

  if (allowedOrigins.includes(normalizedOrigin)) {
    return callback(null, true);
  }

  console.error(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
  return callback(new Error('Not allowed by CORS'));
};

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH'],
    credentials: true
  }
});

// Make io accessible in routes/controllers
app.set('io', io);

// Middleware
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('👉 Connected DB:', mongoose.connection.name);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);

// Serve frontend build in production (single-service deployment)
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
  app.use(express.static(frontendBuildPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Campus Complaint System API is running' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Student joins their personal room for targeted notifications
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined their room`);
  });

  // Admin joins admin room
  socket.on('join_admin_room', () => {
    socket.join('admin_room');
    console.log(`🛠️  Admin joined admin room`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Socket.io ready`);
});

