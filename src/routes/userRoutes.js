const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const bcrypt = require("bcrypt");

// ... existing routes ...

// Add test users route
router.get('/add-test-users', async (req, res) => {
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
        year: "3rd",
        gender: "Female",
        about: "AI/ML enthusiast",
        photoUrl: "https://randomuser.me/api/portraits/women/4.jpg"
      },
      {
        firstName: "Arjun",
        lastName: "Reddy",
        emailId: "arjun@gmail.com",
        password: "123456",
        branch: "Civil",
        year: "2nd",
        gender: "Male",
        about: "Love designing sustainable structures",
        photoUrl: "https://randomuser.me/api/portraits/men/5.jpg"
      }
    ];

    // Hash passwords before saving
    const hashedUsers = await Promise.all(testUsers.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return { ...user, password: hashedPassword };
    }));

    // Insert users into database
    const result = await User.insertMany(hashedUsers);
    res.json({ message: "Test users added successfully", users: result });
  } catch (error) {
    console.error("Error adding test users:", error);
    res.status(500).json({ error: "Failed to add test users" });
  }
});

module.exports = router; 