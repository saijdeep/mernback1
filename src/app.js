require('dotenv').config();
const express = require("express");
const connectDB = require("./config/database.js");
const app = express();
const User = require("./models/user.js");
const {validateSignUpData} = require("./utilis/validation.js");
const bcrypt = require('bcrypt');
const cookieParser = require("cookie-parser");
const jsonWebToken = require("jsonwebtoken");
const { userAuth } = require("./middlewares/auth.js");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { ChatRoom, Message } = require("./models/chat");

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.IO server
const io = new Server(httpServer, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:5177",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175",
            "http://127.0.0.1:5176",
            "http://127.0.0.1:5177",
            "https://studenthub-4.onrender.com",  
            "https://studenthub-5.onrender.com",
            "https://studenthub-6.onrender.com",
            "https://studenthub-23xj.onrender.com"
        ],
        credentials: true
    }
});

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error"));
        }

        const decoded = await jsonWebToken.verify(token, "DEV@STUDENT$768");
        const user = await User.findById(decoded._id);
        if (!user) {
            return next(new Error("User not found"));
        }

        socket.user = user;
        next();
    } catch (err) {
        next(new Error("Authentication error"));
    }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log("User connected:", socket.user.firstName);

    // Join a chat room
    socket.on("join_room", async (roomId) => {
        try {
            const room = await ChatRoom.findById(roomId);
            if (!room) {
                socket.emit("error", "Room not found");
                return;
            }

            socket.join(roomId);
            socket.emit("joined_room", room);
            
            // Notify others in the room
            socket.to(roomId).emit("user_joined", {
                userId: socket.user._id,
                firstName: socket.user.firstName,
                lastName: socket.user.lastName
            });
        } catch (err) {
            socket.emit("error", err.message);
        }
    });

    // Leave a chat room
    socket.on("leave_room", (roomId) => {
        socket.leave(roomId);
        socket.to(roomId).emit("user_left", {
            userId: socket.user._id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName
        });
    });

    // Send a message
    socket.on("send_message", async ({ roomId, content }) => {
        try {
            const room = await ChatRoom.findById(roomId);
            if (!room) {
                socket.emit("error", "Room not found");
                return;
            }

            const message = new Message({
                sender: socket.user._id,
                content,
                room: roomId,
                timestamp: new Date(),
                deliveredAt: new Date()
            });

            await message.save();
            room.messages.push(message._id);
            room.lastMessage = message._id;
            await room.save();

            const populatedMessage = await Message.findById(message._id)
                .populate('sender', 'firstName lastName photoUrl');

            io.to(roomId).emit("new_message", populatedMessage);
        } catch (err) {
            socket.emit("error", err.message);
        }
    });

    // Handle typing status
    socket.on("typing", ({ roomId, isTyping }) => {
        socket.to(roomId).emit("user_typing", {
            userId: socket.user._id,
            firstName: socket.user.firstName,
            isTyping
        });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.user.firstName);
    });
});

// Improved CORS configuration
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "http://127.0.0.1:5177",
    "https://studenthub-4.onrender.com",  
    "https://studenthub-5.onrender.com",
    "https://studenthub-6.onrender.com",
    "https://studenthub-23xj.onrender.com"
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["set-cookie"]
}));

// Parse cookies and JSON body
app.use(cookieParser());
app.use(express.json());

const authRouter = require("./routes/authR.js");
const profileRouter = require("./routes/profile.js");
const requestRouter = require("./routes/request.js");
const userRouter = require("./routes/userR.js");
const postRouter = require("./routes/post.js");
const chatRouter = require("./routes/chat.js");

// Mount routers
app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/request", requestRouter);
app.use("/user", userRouter);
app.use("/posts", postRouter);
app.use("/chat", chatRouter);

// Add a route handler for the root path ('/')
app.get('/', (req, res) => {
  res.send('Welcome to the Student Hub Backend!'); // Or any other message/response you want
});


// Add test users route
app.post('/auth/add-test-users', async (req, res) => {
    try {
        const testUsers = [
            {
                firstName: "Rahul",
                lastName: "Kumar",
                emailId: "rahul@gmail.com",
                password: "123456",
                branch: "Computer Science",
                year: "3rd",
                gender: "Male",
                about: "Love coding and playing guitar",
                photoUrl: "https://randomuser.me/api/portraits/men/1.jpg"
            },
            {
                firstName: "Priya",
                lastName: "Sharma",
                emailId: "priya@gmail.com",
                password: "123456",
                branch: "Electronics",
                year: "2nd",
                gender: "Female",
                about: "Passionate about robotics",
                photoUrl: "https://randomuser.me/api/portraits/women/2.jpg"
            },
            {
                firstName: "Amit",
                lastName: "Singh",
                emailId: "amit@gmail.com",
                password: "123456",
                branch: "Mechanical",
                year: "4th",
                gender: "Male",
                about: "Sports enthusiast and tech lover",
                photoUrl: "https://randomuser.me/api/portraits/men/3.jpg"
            },
            {
                firstName: "Neha",
                lastName: "Patel",
                emailId: "neha@gmail.com",
                password: "123456",
                branch: "Computer Science",
                year: "2nd",
                gender: "Female",
                about: "AI/ML enthusiast",
                photoUrl: "https://randomuser.me/api/portraits/women/4.jpg"
            }
        ];

        for (const userData of testUsers) {
            const existingUser = await User.findOne({ emailId: userData.emailId });
            if (!existingUser) {
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                const user = new User({
                    ...userData,
                    password: hashedPassword
                });
                await user.save();
            }
        }

        res.status(200).json({ message: "Test users added successfully" });
    } catch (error) {
        console.error("Error adding test users:", error);
        res.status(500).json({ error: "Failed to add test users" });
    }
});

// Connect to database
connectDB();

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

