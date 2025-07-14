const express = require("express");
const userRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const USER_SAFE_DATA = "firstName lastName photoUrl age gender about skills branch year";

userRouter.get("/requests/received", userAuth, async (req, res) => {
    try{
        const loggedInUser = req.user;
        const connectionRequests = await ConnectionRequest.find({
            toUserId: loggedInUser._id,
            status:"interested",
        }).populate({
            path: "fromUserId",
            select: USER_SAFE_DATA,
            strictPopulate: false,
        });

        res.json({
            message:"Data fetched succesfully",
            data: connectionRequests,
        });

    }catch(err){
        res.status(400).send("ERROR:" +err.message);
    }

});

userRouter.get("/connections", userAuth, async(req, res) => {
    try {
        const loggedInUser = req.user;
        const connectionRequests = await ConnectionRequest.find({
            $or: [
                { toUserId: loggedInUser._id, status: "accepted" },
                { fromUserId: loggedInUser._id, status: "accepted" }
            ]
        }).populate("fromUserId", USER_SAFE_DATA)
          .populate("toUserId", USER_SAFE_DATA);

        const data = connectionRequests.map((row) => {
            return row.fromUserId._id.toString() === loggedInUser._id.toString() 
                ? row.toUserId 
                : row.fromUserId;
        });

        res.status(200).json({ success: true, data });
    } catch (err) {
        console.error("Error fetching connections:", err);
        res.status(500).json({ 
            success: false, 
            message: err.message || "Failed to fetch connections" 
        });
    }
});

userRouter.get("/feed", userAuth ,async(req, res) => {

    try {
        const loggedInUser = req.user;

        const page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        limit = limit>50 ? 50 :limit;


        const skip = (page - 1 ) * limit;

        const connectionRequests = await ConnectionRequest.find({
            $or: [
                { fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id}],
        }).select("fromUserId toUserId");


        const hideUsersFromFeed = new Set();
        connectionRequests.forEach((req) => {
            hideUsersFromFeed.add(req.fromUserId.toString());
            hideUsersFromFeed.add(req.toUserId.toString());
        });
        console.log( hideUsersFromFeed);

        const users = await User.find({
           $and: [
            { _id: { $nin: Array.from(hideUsersFromFeed) } },
            { _id: { $ne: loggedInUser._id } },
        ],
        }).select(USER_SAFE_DATA).skip(skip).limit(limit);

       // res.send(users);//
       res.status(200).json({ data: users });


    }catch (err){
        res.status(400).json({message: err.message});
    }
  
});

userRouter.get("/:userId", userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select(
            "firstName lastName photoUrl age gender about skills branch year semester yearOfEducation"
        );
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = userRouter;  
