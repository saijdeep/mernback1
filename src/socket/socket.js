const { Server } = require('socket.io');
const Message = require('../models/message');

let io;
const onlineUsers = new Map();

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', (userData) => {
      onlineUsers.set(socket.id, userData);
      io.emit('users', Array.from(onlineUsers.values()));
      console.log('User joined:', userData.name);
    });

    socket.on('message', async (data) => {
      try {
        const message = new Message({
          sender: data.sender,
          content: data.content,
          timestamp: new Date()
        });
        await message.save();

        io.emit('message', {
          id: message._id,
          sender: data.sender,
          content: data.content,
          timestamp: message.timestamp
        });
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('error', { message: 'Failed to save message' });
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      io.emit('users', Array.from(onlineUsers.values()));
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = { initSocket }; 