const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not set. Add it to your environment configuration.');
        }
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB (Shoply database)');
        return true;
    } catch (err) {
        console.error('MongoDB connection error:', err);
        return false;
    }
};

module.exports = connectDB;

