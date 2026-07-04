require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
const User = require('./models/User');
const Message = require('./models/Message');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// CORS setup
app.use(cors({
  origin: '*', // Allows integration tests and client access from any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder statically (fallback for uploads when Cloudinary is not used)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io initialization
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  }
});

// Set socket instance on app to use in controllers for notifications
app.set('io', io);

// Socket.io Auth Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;

  if (!token) {
    return next(new Error('Authentication error: Token is required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_nexora_jwt_key_987654321');
    socket.userId = decoded.id;
    next();
  } catch (err) {
    // If auth bypass is enabled and it's a test client handshake
    if (process.env.BYPASS_GOOGLE_AUTH === 'true' && token.startsWith('mock_')) {
      socket.userId = token.replace('mock_', ''); // Just use the mock text as ID or handle gracefully
      return next();
    }
    return next(new Error('Authentication error: Invalid Token'));
  }
});

// Socket connection logic
io.on('connection', (socket) => {
  console.log(`Socket Client Connected: ${socket.id} (User ID: ${socket.userId})`);

  // Join a private room specific to this user ID (allows targeted messaging)
  socket.join(`user_${socket.userId}`);

  // Listen for sending a private message
  socket.on('send_message', async (data) => {
    const { receiverId, content } = data;

    if (!receiverId || !content) {
      return socket.emit('error_message', { message: 'Receiver identity and message content are required' });
    }

    try {
      const senderId = socket.userId;

      // Save message in database
      const newMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        content: content,
      });

      // Populate sender metadata for UI display
      const populatedMsg = await Message.findById(newMessage._id)
        .populate('sender', 'name picture role')
        .populate('receiver', 'name picture role');

      // Emit to receiver's private room
      io.to(`user_${receiverId}`).emit('receive_message', populatedMsg);

      // Acknowledge back to sender
      socket.emit('message_sent', populatedMsg);

    } catch (error) {
      console.error('Socket message send error:', error);
      socket.emit('error_message', { message: 'Failed to deliver message' });
    }
  });

  // Handle socket disconnect
  socket.on('disconnect', () => {
    console.log(`Socket Client Disconnected: ${socket.id}`);
  });
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const testRoutes = require('./routes/testRoutes');
const chatRoutes = require('./routes/chatRoutes');
const mentorRoutes = require('./routes/mentorRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/mentors', mentorRoutes);

// Simple Health Status Check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'healthy', platform: 'Nexora API Gateway' });
});

// Port configuration
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Nexora Server operating on port ${PORT} in environment ${process.env.NODE_ENV || 'development'}`);
});
