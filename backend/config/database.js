const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Shoply';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB (Shoply database)');
        return true;
    } catch (err) {
        console.error('MongoDB connection error:', err);
        return false;
    }
};

module.exports = connectDB;

