const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register user endpoint
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing name, email or password' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }

        const newUser = new User({
            name,
            email,
            password
        });

        await newUser.save();

        console.log('New user registered:', { name, email });
        return res.status(201).json({ success: true, message: 'Registration successful! You can now login.' });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// User login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            console.log('Login attempt failed: User not found with email:', email);
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Check password (plain text comparison for now)
        if (user.password !== password) {
            console.log('Login attempt failed: Incorrect password for email:', email);
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        console.log('User logged in:', email);
        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;

