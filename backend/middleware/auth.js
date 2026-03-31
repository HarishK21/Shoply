const AuthSession = require('../models/AuthSession');
const User = require('../models/User');
const { getBearerToken, hashAuthToken } = require('../utils/auth');

const requireAuth = async (req, res, next) => {
    try {
        const token = getBearerToken(req.headers.authorization);
        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const tokenHash = hashAuthToken(token);
        const session = await AuthSession.findOne({
            tokenHash,
            expiresAt: { $gt: new Date() }
        }).lean();

        if (!session) {
            return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
        }

        const user = await User.findOne({ id: session.userId }).lean();
        if (!user) {
            await AuthSession.deleteOne({ _id: session._id });
            return res.status(401).json({ success: false, message: 'Invalid session' });
        }

        req.authUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        req.tokenHash = tokenHash;
        return next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.authUser || req.authUser.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    return next();
};

module.exports = {
    requireAuth,
    requireAdmin
};

