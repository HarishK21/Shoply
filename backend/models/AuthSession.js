const mongoose = require('mongoose');

const authSessionSchema = new mongoose.Schema({
    userId: { type: Number, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true }
}, { timestamps: true });

// Auto-remove expired sessions from MongoDB.
authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AuthSession', authSessionSchema);
