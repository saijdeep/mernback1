const express = require('express');
const postRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const Post = require("../models/post");

// Get all posts with optional category filter
postRouter.get("/", userAuth, async (req, res) => {
    try {
        const { category } = req.query;
        const query = category ? { category } : {};
        
        const posts = await Post.find(query)
            .populate('author', 'firstName lastName photoUrl')
            .sort({ createdAt: -1 });
        
        res.json({
            message: "Posts fetched successfully",
            data: posts
        });
    } catch (err) {
        console.error("Error fetching posts:", err);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});

// Create a new post
postRouter.post("/", userAuth, async (req, res) => {
    try {
        const { title, content, category } = req.body;
        
        const post = new Post({
            title,
            content,
            category,
            author: req.user._id
        });
        
        await post.save();
        const populatedPost = await Post.findById(post._id)
            .populate('author', 'firstName lastName photoUrl');
        
        res.status(201).json({
            message: "Post created successfully",
            data: populatedPost
        });
    } catch (err) {
        console.error("Error creating post:", err);
        res.status(400).json({ error: err.message || "Failed to create post" });
    }
});

// Update a post
postRouter.patch("/:postId", userAuth, async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, content, category } = req.body;
        
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        
        // Check if the user is the author
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Not authorized to edit this post" });
        }
        
        post.title = title || post.title;
        post.content = content || post.content;
        post.category = category || post.category;
        post.updatedAt = Date.now();
        
        await post.save();
        const updatedPost = await Post.findById(postId)
            .populate('author', 'firstName lastName photoUrl');
        
        res.json({
            message: "Post updated successfully",
            data: updatedPost
        });
    } catch (err) {
        console.error("Error updating post:", err);
        res.status(400).json({ error: err.message || "Failed to update post" });
    }
});

// Delete a post
postRouter.delete("/:postId", userAuth, async (req, res) => {
    try {
        const { postId } = req.params;
        
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        
        // Check if the user is the author
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Not authorized to delete this post" });
        }
        
        await Post.findByIdAndDelete(postId);
        
        res.json({
            message: "Post deleted successfully",
            data: post
        });
    } catch (err) {
        console.error("Error deleting post:", err);
        res.status(400).json({ error: err.message || "Failed to delete post" });
    }
});

module.exports = postRouter; 