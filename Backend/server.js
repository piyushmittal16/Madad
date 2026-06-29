const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Route parameters handlers mapping channels
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

dotenv.config();
const app = express();

// Enable Cross-Origin Resource Sharing for modern full-stack setups
app.use(cors({ origin: '*' }));
app.use(express.json());

// Create Native HTTP Server wrapper around express
const server = http.createServer(app);

// Initialize real-time Socket.io engine matrix
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// 🔥 MIDDLEWARE: Inject the io instance straight into request headers for controllers usage
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Real-time socket network connection pipeline channel listener
io.on('connection', (socket) => {
  console.log(`📡 Socket Connection Sync Successful: Token ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 Socket Disconnected from Matrix: ${socket.id}`);
  });
});

// API Core Routing Channels Registration Matrix
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);

// Database Connection String Framework Configuration
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/madad";
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Production Database Sync Completed: MongoDB Live.'))
  .catch(err => console.error('❌ Mongoose Database Grid Sync Faults:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 System Server Operational inside Port Allocation ${PORT}`));