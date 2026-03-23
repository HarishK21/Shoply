require('dotenv').config();

const crypto = require('crypto');
const express = require('express');

const connectDB = require('./config/database');
const seedDatabase = require('./config/seed');
const setupMiddleware = require('./middleware');

const itemRoutes = require('./routes/items');

const Item = require('./models/Item');
const Order = require('./models/Order');
const User = require('./models/User');
const Cart = require('./models/Cart');
const AuthSession = require('./models/AuthSession');

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

setupMiddleware(app);

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

const parseIntParam = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : null;
};

const parseQuantity = (value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed < 0) return null;
    return parsed;
};

const getBearerToken = (authHeader) => {
    if (typeof authHeader !== 'string') return null;
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : null;
};

const getOrCreateCart = async (userId) => {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
        cart = new Cart({ userId, items: [] });
        await cart.save();
    }
    return cart;
};

const hydrateCartItems = async (cartDoc) => {
    const rawItems = Array.isArray(cartDoc?.items) ? cartDoc.items : [];
    if (rawItems.length === 0) {
        return [];
    }

    const uniqueItemIds = [...new Set(rawItems.map((entry) => entry.itemId))];
    const dbItems = await Item.find({ id: { $in: uniqueItemIds } }).lean();
    const itemById = new Map(dbItems.map((entry) => [entry.id, entry]));

    const hydratedItems = [];
    let removedStaleItems = false;

    for (const entry of rawItems) {
        const storeItem = itemById.get(entry.itemId);
        if (!storeItem) {
            removedStaleItems = true;
            continue;
        }
        hydratedItems.push({
            ...storeItem,
            quantity: entry.quantity
        });
    }

    // Keep cart clean if products were deleted from the store.
    if (removedStaleItems && cartDoc && typeof cartDoc.save === 'function') {
        cartDoc.items = rawItems.filter((entry) => itemById.has(entry.itemId));
        await cartDoc.save();
    }

    return hydratedItems;
};

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
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Shoply API is running' });
});

// Product + order routes
app.use('/api/items', itemRoutes);

// Register user endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing name, email or password' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }

        const newUser = new User({
            name: String(name).trim(),
            email: normalizedEmail,
            password: hashPassword(password)
        });

        await newUser.save();
        console.log('New user registered:', { name: newUser.name, email: normalizedEmail });

        return res.status(201).json({
            success: true,
            message: 'Registration successful! You can now login.'
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// User login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Missing email or password' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user || !verifyPassword(password, user.password)) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // One active session per user.
        await AuthSession.deleteMany({ userId: user.id });

        const token = createAuthToken();
        await AuthSession.create({
            userId: user.id,
            tokenHash: hashAuthToken(token),
            expiresAt: new Date(Date.now() + SESSION_TTL_MS)
        });

        // Upgrade legacy plaintext users to hashed passwords on successful login.
        if (!isHashedPassword(user.password)) {
            user.password = hashPassword(password);
            await user.save();
        }

        console.log('User logged in:', normalizedEmail);
        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Current authenticated user
app.get('/api/me', requireAuth, async (req, res) => {
    return res.status(200).json({ success: true, user: req.authUser });
});

// Create new order
app.post('/api/order', requireAuth, async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            address,
            city,
            postalCode,
            cardName,
            cardNumber,
            cardExpiry,
            cardCVV,
            totalPrice,
            items
        } = req.body;

        if (
            !firstName || !lastName || !email || !address || !city || !postalCode ||
            !cardName || !cardNumber || !cardExpiry || !cardCVV || !totalPrice || !items
        ) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const newOrder = new Order({
            firstName,
            lastName,
            userId: req.authUser.id,
            email,
            address,
            city,
            postalCode,
            cardName,
            cardNumber,
            expiryDate: cardExpiry,
            cvv: cardCVV,
            totalPrice: Number(totalPrice),
            items
        });

        await newOrder.save();
        const savedOrder = await Order.findOne({ id: newOrder.id }).lean();
        return res.status(201).json(savedOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all orders for a specific user
app.get('/api/orders/:userID', requireAuth, async (req, res) => {
    try {
        const userId = parseIntParam(req.params.userID);
        if (userId === null) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        if (req.authUser.role !== 'admin' && userId !== req.authUser.id) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const orders = await Order.find({ userId }).sort({ id: -1 }).lean();
        return res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Logout endpoint
app.post('/api/logout', requireAuth, async (req, res) => {
    try {
        await AuthSession.deleteOne({ tokenHash: req.tokenHash });
        return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get authenticated user's cart
app.get('/api/cart', requireAuth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.authUser.id });
        if (!cart) {
            return res.status(200).json({ success: true, items: [] });
        }

        const items = await hydrateCartItems(cart);
        return res.status(200).json({ success: true, items });
    } catch (error) {
        console.error('Error fetching cart:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add item to authenticated user's cart
app.post('/api/cart/items', requireAuth, async (req, res) => {
    try {
        const itemId = parseIntParam(req.body.itemId);
        const quantity = parseQuantity(req.body.quantity ?? 1);

        if (itemId === null || quantity === null || quantity < 1) {
            return res.status(400).json({ success: false, message: 'Invalid itemId or quantity' });
        }

        const existingItem = await Item.findOne({ id: itemId }).lean();
        if (!existingItem) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        const cart = await getOrCreateCart(req.authUser.id);
        const index = cart.items.findIndex((entry) => entry.itemId === itemId);

        if (index >= 0) {
            cart.items[index].quantity += quantity;
        } else {
            cart.items.push({ itemId, quantity });
        }

        await cart.save();
        const items = await hydrateCartItems(cart);
        return res.status(200).json({ success: true, items });
    } catch (error) {
        console.error('Error adding to cart:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update quantity for one cart item
app.patch('/api/cart/items/:itemId', requireAuth, async (req, res) => {
    try {
        const itemId = parseIntParam(req.params.itemId);
        const quantity = parseQuantity(req.body.quantity);

        if (itemId === null || quantity === null) {
            return res.status(400).json({ success: false, message: 'Invalid itemId or quantity' });
        }

        const cart = await getOrCreateCart(req.authUser.id);
        const index = cart.items.findIndex((entry) => entry.itemId === itemId);
        if (index < 0) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        if (quantity === 0) {
            cart.items = cart.items.filter((entry) => entry.itemId !== itemId);
        } else {
            cart.items[index].quantity = quantity;
        }

        await cart.save();
        const items = await hydrateCartItems(cart);
        return res.status(200).json({ success: true, items });
    } catch (error) {
        console.error('Error updating cart item:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Remove one item from authenticated user's cart
app.delete('/api/cart/items/:itemId', requireAuth, async (req, res) => {
    try {
        const itemId = parseIntParam(req.params.itemId);
        if (itemId === null) {
            return res.status(400).json({ success: false, message: 'Invalid item id' });
        }

        const cart = await Cart.findOne({ userId: req.authUser.id });
        if (!cart) {
            return res.status(200).json({ success: true, items: [] });
        }

        cart.items = cart.items.filter((entry) => entry.itemId !== itemId);
        await cart.save();

        const items = await hydrateCartItems(cart);
        return res.status(200).json({ success: true, items });
    } catch (error) {
        console.error('Error removing cart item:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Clear authenticated user's cart
app.delete('/api/cart', requireAuth, async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.authUser.id);
        cart.items = [];
        await cart.save();
        return res.status(200).json({ success: true, items: [] });
    } catch (error) {
        console.error('Error clearing cart:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 404 fallback for unknown API routes
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Start server after database connection
const startServer = async () => {
    try {
        const connected = await connectDB();
        if (connected) {
            await seedDatabase();
        } else {
            console.warn('Warning: MongoDB connection failed. Server will start but database operations may fail.');
        }

        app.listen(PORT, () => {
            console.log('Server has started on port ' + PORT);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
