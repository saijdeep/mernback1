const express = require('express');
const profileRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const { validate } = require('../models/user');
const{ validateEditProfileData } = require("../utilis/validation.js");



 profileRouter.get("/profile/view", userAuth, async (req, res) => {
    try{
        const user = req.user;
        res.send(user);
    }catch (err){
        res.status(400).send("ERROR : " + err.message);
    }
});
profileRouter.patch("/profile/edit", userAuth, async(req,res) => {
    try{
   if(!validateEditProfileData(req)){
    throw new Error("Invalid Edit Request");
}
   const loggedInUser = req.user;

   Object.keys(req.body).forEach((key) => (loggedInUser[key]= req.body[key]));

   await loggedInUser.save() ; 
   console.log('Updated user:', loggedInUser);

   res.json({
    message : "profile updated successfully!!!",
    data:loggedInUser,
    });
    
}catch(err){
    res.status(400).send("ERROR :" +err.message);
}
});
///one oending forgotten password//

module.exports = profileRouter