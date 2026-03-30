const crypto = require('crypto');

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
    const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${passwordHash}`;
};

const isHashedPassword = (storedPassword) => {
    if (typeof storedPassword !== 'string') return false;
    const parts = storedPassword.split(':');
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
};

const verifyPassword = (passwordInput, storedPassword) => {
    if (typeof storedPassword !== 'string' || typeof passwordInput !== 'string') {
        return false;
    }

    if (!isHashedPassword(storedPassword)) {
        return passwordInput === storedPassword;
    }

    const [salt, storedHash] = storedPassword.split(':');
    const inputHash = crypto.scryptSync(passwordInput, salt, 64).toString('hex');

    try {
        return crypto.timingSafeEqual(
            Buffer.from(inputHash, 'hex'),
            Buffer.from(storedHash, 'hex')
        );
    } catch (error) {
        return false;
    }
};

const createAuthToken = () => crypto.randomBytes(48).toString('hex');

const hashAuthToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const getBearerToken = (authHeader) => {
    if (typeof authHeader !== 'string') return null;
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : null;
};

module.exports = {
    hashPassword,
    isHashedPassword,
    verifyPassword,
    createAuthToken,
    hashAuthToken,
    getBearerToken
};

