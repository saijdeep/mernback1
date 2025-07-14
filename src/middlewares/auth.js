const jsonWebToken = require("jsonwebtoken");
const User = require("../models/user")

const userAuth = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ error: "Please login first" });
        }

        const decodedObj = await jsonWebToken.verify(token, "DEV@STUDENT$768");
        const { _id } = decodedObj;

        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("Auth Error:", err);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: "Invalid token" });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token expired" });
        }
        res.status(401).json({ error: "Authentication failed" });
    }
};

module.exports = {
    userAuth,
};