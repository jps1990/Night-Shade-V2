import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

// Socket.IO setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store rooms and users in memory
const rooms = new Map();
const users = new Map();
const userSockets = new Map();

// Initialize bot room
rooms.set('bot-room', {
  id: 'bot-room',
  name: "Jester's Asylum",
  icon: '🃏',
  messages: [],
  users: [],
  isPermanent: true,
});

io.on('connection', (socket) => {
  console.log('Client connected');
  let userId = null;

  socket.emit('init', {
    rooms: Array.from(rooms.values()),
    users: Array.from(users.values())
  });

  socket.on('register', (user) => {
    if (!user?.id) return;
    console.log('User registered:', user);
    userId = user.id;
    users.set(user.id, user);
    userSockets.set(user.id, socket.id);
    socket.broadcast.emit('userJoined', user);
  });

  socket.on('createRoom', (room) => {
    if (!room?.id || !userId) return;
    rooms.set(room.id, room);
    socket.broadcast.emit('roomCreated', room);
  });

  socket.on('updateRoom', ({ roomId, updates }) => {
    if (!roomId || !updates || !userId) return;
    const room = rooms.get(roomId);
    if (room && !room.isPermanent) {
      const updatedRoom = { ...room, ...updates };
      rooms.set(roomId, updatedRoom);
      socket.broadcast.emit('roomUpdated', updatedRoom);
    }
  });

  socket.on('message', ({ roomId, message }) => {
    if (!roomId || !message || !userId) return;
    const room = rooms.get(roomId);
    if (room) {
      if (!message.content?.trim()) return;
      room.messages.push(message);
      io.emit('newMessage', { roomId, message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if (userId) {
      userSockets.delete(userId);
      if (!Array.from(userSockets.values()).includes(userId)) {
        users.delete(userId);
        socket.broadcast.emit('userLeft', userId);
      }
    }
  });
});

// Start server on a different port than Vite
const PORT = 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Socket.IO server running on http://localhost:${PORT}`);
});