const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');

const toPositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const rawAuthWindowMinutes = toPositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES, 15);
const authWindowMinutes = Math.min(15, Math.max(10, rawAuthWindowMinutes));

const JSON_BODY_LIMIT = process.env.REQUEST_BODY_LIMIT || '32kb';
const API_RATE_LIMIT_WINDOW_MS = toPositiveInt(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const API_RATE_LIMIT_MAX = toPositiveInt(process.env.API_RATE_LIMIT_MAX, 120);
const AUTH_RATE_LIMIT_MAX = toPositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 5);
const AUTH_RATE_LIMIT_WINDOW_MS = authWindowMinutes * 60 * 1000;

const buildLimiter = ({ windowMs, max, message }) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message }
});

const apiRateLimiter = buildLimiter({
    windowMs: API_RATE_LIMIT_WINDOW_MS,
    max: API_RATE_LIMIT_MAX,
    message: 'Too many requests, please try again later.'
});

const authRateLimiter = buildLimiter({
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    max: AUTH_RATE_LIMIT_MAX,
    message: `Too many authentication attempts. Try again in about ${authWindowMinutes} minutes.`
});

const stripSuspiciousKeys = (value) => {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) {
        return value.map(stripSuspiciousKeys);
    }

    const cleaned = {};
    for (const [key, entry] of Object.entries(value)) {
        if (key.startsWith('$') || key.includes('.')) continue;
        cleaned[key] = stripSuspiciousKeys(entry);
    }
    return cleaned;
};

const sanitizeRequestPayload = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = stripSuspiciousKeys(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        req.query = stripSuspiciousKeys(req.query);
    }
    if (req.params && typeof req.params === 'object') {
        req.params = stripSuspiciousKeys(req.params);
    }
    next();
};

const payloadErrorHandler = (err, req, res, next) => {
    if (err && err.type === 'entity.too.large') {
        return res.status(413).json({ success: false, message: 'Payload too large' });
    }
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ success: false, message: 'Malformed JSON payload' });
    }
    return next(err);
};

const setupMiddleware = (app) => {
    app.set('trust proxy', 1);

    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' }
    }));
    app.use(cors({
        origin: true,
        credentials: true
    }));
    app.use(express.json({ limit: JSON_BODY_LIMIT, strict: true }));
    app.use(express.urlencoded({ extended: false, limit: JSON_BODY_LIMIT }));
    app.use(payloadErrorHandler);
    app.use(sanitizeRequestPayload);
    app.use(express.static(path.join(__dirname, '../public')));

    return {
        apiRateLimiter,
        authRateLimiter
    };
};

module.exports = setupMiddleware;

