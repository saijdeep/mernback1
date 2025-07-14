const express = require('express');
const router = express.Router();
const { ChatRoom, Message } = require('../models/chat');
const { userAuth } = require('../middlewares/auth');

// Create a new chat room or get existing one
router.post('/room', userAuth, async (req, res) => {
    try {
        const { participantId } = req.body;
        
        // Check if room already exists
        let room = await ChatRoom.findOne({
            participants: { 
                $all: [req.user._id, participantId],
                $size: 2
            }
        });

        if (!room) {
            room = new ChatRoom({
                participants: [req.user._id, participantId]
            });
            await room.save();
        }

        await room.populate('participants', 'firstName lastName photoUrl');
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all chat rooms for a user
router.get('/rooms', userAuth, async (req, res) => {
    try {
        const rooms = await ChatRoom.find({
            participants: req.user._id
        })
        .populate('participants', 'firstName lastName photoUrl')
        .sort({ lastMessage: -1 });
        
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get messages for a specific room
router.get('/messages/:roomId', userAuth, async (req, res) => {
    try {
        const room = await ChatRoom.findById(req.params.roomId)
            .populate({
                path: 'messages',
                populate: {
                    path: 'sender',
                    select: 'firstName lastName photoUrl'
                }
            });

        if (!room) {
            return res.status(404).json({ error: 'Chat room not found' });
        }

        // Check if user is participant
        if (!room.participants.includes(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized to access this chat room' });
        }

        res.json(room.messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get recent chat rooms for a user
router.get('/recent', userAuth, async (req, res) => {
    try {
        const rooms = await ChatRoom.find({
            participants: req.user._id
        })
        .populate('participants', 'firstName lastName photoUrl')
        .sort({ lastMessage: -1 })
        .limit(10); // Limit to 10 most recent rooms, adjust as needed
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get unread chat message count for the logged-in user
router.get('/unread', userAuth, async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ participants: req.user._id }).select('_id');
    const roomIds = rooms.map(r => r._id);
    const unreadCount = await Message.countDocuments({
      room: { $in: roomIds },
      sender: { $ne: req.user._id },
      readBy: { $ne: req.user._id }
    });
    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all messages in a room as read by the current user
router.post('/messages/:roomId/mark-read', userAuth, async (req, res) => {
  try {
    await Message.updateMany(
      { room: req.params.roomId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 