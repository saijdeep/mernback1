const express = require('express');

const requestRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

// Get received requests
requestRouter.get("/received", userAuth, async (req, res) => {
    try {
        const userId = req.user._id;
        const requests = await ConnectionRequest.find({
            toUserId: userId,
            status: "interested"
        }).populate('fromUserId', 'firstName lastName photoUrl branch about');

        res.json({
            success: true,
            message: "Requests fetched successfully",
            data: requests
        });
    } catch (err) {
        console.error("Error fetching requests:", err);
        res.status(500).json({ 
            success: false,
            error: "Failed to fetch requests" 
        });
    }
});

// Send connection request
requestRouter.post("/send/:status/:toUserId", userAuth, async(req, res) => {
    try {
        const fromUserId = req.user._id;
        const toUserId = req.params.toUserId;
        const status = req.params.status;

        if (!['connect', 'ignore'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: "Invalid status. Must be 'connect' or 'ignore'"
            });
        }

        const toUser = await User.findById(toUserId);
        if (!toUser) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        // Check for existing connection request
        const existingConnectionRequest = await ConnectionRequest.findOne({
            $or: [
                {fromUserId, toUserId},
                {fromUserId: toUserId, toUserId: fromUserId},
            ],
        });

        if (existingConnectionRequest) {
            return res.status(400).json({
                success: false,
                error: "Connection Request Already Exists!"
            });
        }

        const connectionRequest = new ConnectionRequest({
            fromUserId,
            toUserId,
            status: status === 'connect' ? 'interested' : 'ignored',
        });

        const data = await connectionRequest.save();
        res.json({
            success: true,
            message: `Request ${status === 'connect' ? 'sent' : 'ignored'} successfully`,
            data,
        });
    } catch (err) {
        console.error("Error sending request:", err);
        res.status(500).json({ 
            success: false,
            error: "Failed to send request" 
        });
    }
});

// Review connection request
requestRouter.post("/review/:status/:requestId", userAuth, async(req, res) => {
    try {
        const loggedInUser = req.user;
        const {status, requestId} = req.params;

        const allowedStatus = ["accepted", "rejected"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                error: "Invalid status. Must be 'accepted' or 'rejected'"
            });
        }

        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toUserId: loggedInUser._id,
            status: "interested",
        });

        if (!connectionRequest) {
            return res.status(404).json({
                success: false,
                error: "Connection request not found"
            });
        }

        connectionRequest.status = status;
        const data = await connectionRequest.save();

        res.json({
            success: true,
            message: `Connection request ${status}`,
            data
        });
    } catch (err) {
        console.error("Error reviewing request:", err);
        res.status(500).json({ 
            success: false,
            error: "Failed to review request" 
        });
    }
});

module.exports = requestRouter;
