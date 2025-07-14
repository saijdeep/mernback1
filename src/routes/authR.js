const express = require("express");
const authRouter = express.Router();

const{ validateSignUpData } = require("../utilis/validation.js");

const User = require("../models/user");
const bcrypt = require('bcrypt');


authRouter.post("/signup",async(req,res)=>{
    try{
        // Validate data
        validateSignUpData(req);
        const{firstName, lastName, emailId, password} = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({emailId});
        if (existingUser) {
            return res.status(400).json({error: "Email already registered"});
        }

        // Encrypt the password
        const passwordHash = await bcrypt.hash(password, 10);

        console.log("passs",passwordHash);


        // creating a new instance of the User model
        const user = new User({
            firstName,
            lastName,
            emailId,
            password : passwordHash,
        });

        

            const savedUser = await user.save();
            const token = await savedUser.getJWT();

            // Set cookie and send response
            res.cookie("token", token, {
               expires: new Date(Date.now() + 8 * 3600000),
               httpOnly: true,
               secure: process.env.NODE_ENV === "production",
            });

            res.status(201).json({
                message: "User registered successfully",
                data: savedUser
            });
        }catch(err){
            console.error("Signup error:", err);
            res.status(400).json({
                error: err.message || "Failed to register user"
            });
        }
   
});
authRouter.post("/login",async(req,res) => {
    try{
        const{emailId ,password } = req.body;
        //instance
        const user = await User.findOne({emailId : emailId});
        if(!user){
            return res.status(401).json({
                error: "Invalid email or password"
            });
             }
    const isPasswordValid = await user.validatePassword(password);
        if(isPasswordValid){

         //create a jwt token
         const token = await user.getJWT();
         
         //Add the token to cookie and send the respone back to user
            res.cookie("token", token , {
                expires :new Date(Date.now() + 8*3600000),
                httpOnly: true,
                secure: true,
                sameSite: "None",
                domain: ".onrender.com",
                path: "/"
            });
           res.json({
               message: "Login successful",
               user: {
                 _id: user._id,
                 firstName: user.firstName,
                 lastName: user.lastName,
                 emailId: user.emailId,
                 photoUrl: user.photoUrl,
                 age: user.age,
                 gender: user.gender,
                 about: user.about,
                 skills: user.skills,
                 semester: user.semester,
                 yearOfEducation: user.yearOfEducation
               }
           });
        }else{
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }
            }catch (err){
                console.error("Login error:", err);
                res.status(400).json({
                    error: err.message || "Failed to login"
                });
            }

});

authRouter.post("/logout",async(req,res) => {
    try {
        res.cookie("token", "", {
            expires: new Date(0),
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        });
        res.json({ message: "Logged out successfully" });
    } catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({
            error: "Failed to logout"
        });
    }
});

// Forgot Password Endpoint

authRouter.post("/forgot-password", async (req, res) => {
    try {
        const { emailId } = req.body;
        if (!emailId) {
            return res.status(400).json({ error: "Email is required" });
        }
        const user = await User.findOne({ emailId });
        if (!user) {
            return res.status(404).json({ error: "No user found with this email" });
        }
        // Simulate sending email (in real app, send email here)
        return res.json({ message: "Password reset link sent to your email (simulated)." });
    } catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({ error: "Failed to process forgot password request" });
    }
});

module.exports = authRouter;