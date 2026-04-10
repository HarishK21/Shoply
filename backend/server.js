require('dotenv').config();

const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const connectDB = require('./config/database');
const seedDatabase = require('./config/seed');
const { setupMiddleware, errorHandler, notFound } = require('./middleware');
const { requireAuth } = require('./middleware/auth');
const setupRealtimeSocket = require('./realtime/socket');
const {
    hashPassword,
    isHashedPassword,
    verifyPassword,
    createAuthToken,
    hashAuthToken
} = require('./utils/auth');
const {
    RequestValidationError,
    sanitizeRegisterPayload,
    sanitizeLoginPayload,
    sanitizeOrderPayload,
    sanitizeInteger
} = require('./utils/validation');

const itemRoutes = require('./routes/items');

const Item = require('./models/Item');
const Order = require('./models/Order');
const User = require('./models/User');
const Cart = require('./models/Cart');
const AuthSession = require('./models/AuthSession');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: true,
        credentials: true
    }
});
const PORT = Number(process.env.PORT) || 8080;
const SESSION_TTL_MS = Number.parseInt(process.env.SESSION_TTL_MS, 10) || (1000 * 60 * 60 * 24 * 7); // 7 days

setupMiddleware(app);
setupRealtimeSocket(io);

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

const parseId = (value, label) => sanitizeInteger(value, label, { min: 1, max: 1_000_000_000 });
const parseQuantity = (value, label = 'Quantity') => sanitizeInteger(value, label, { min: 0, max: 1000 });
const handleValidationError = (error, res) => {
    if (error instanceof RequestValidationError) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
    return null;
};

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Shoply API is running' });
});

// Register user endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = sanitizeRegisterPayload(req.body);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }

        const newUser = new User({
            name,
            email,
            password: hashPassword(password)
        });

        await newUser.save();
        console.log('New user registered:', { name: newUser.name, email });

        // Auto-login: create a session and return token + user so the frontend can proceed.
        const token = createAuthToken();
        await AuthSession.create({
            userId: newUser.id,
            tokenHash: hashAuthToken(token),
            expiresAt: new Date(Date.now() + SESSION_TTL_MS)
        });

        return res.status(201).json({
            success: true,
            message: 'Registration successful!',
            token,
            user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
        });
    } catch (error) {
        if (handleValidationError(error, res)) return;
        console.error('Registration error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// User login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = sanitizeLoginPayload(req.body);
        const user = await User.findOne({ email });

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

        console.log('User logged in:', email);
        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        if (handleValidationError(error, res)) return;
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Current authenticated user
app.get('/api/me', requireAuth, async (req, res) => {
    return res.status(200).json({ success: true, user: req.authUser });
});

// Product + order routes
app.use('/api/items', itemRoutes);

// Create new order
app.post('/api/order', requireAuth, async (req, res) => {
    try {
        const sanitized = sanitizeOrderPayload(req.body, req.authUser.id);

        const newOrder = new Order({
            ...sanitized
        });

        await newOrder.save();
        const savedOrder = await Order.findOne({ id: newOrder.id }).lean();
        return res.status(201).json(savedOrder);
    } catch (error) {
        if (handleValidationError(error, res)) return;
        console.error('Error creating order:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Backward-compatible alias expected by the frontend.
app.post('/api/orders', requireAuth, async (req, res) => {
    try {
        const sanitized = sanitizeOrderPayload(req.body, req.authUser.id);
        const newOrder = new Order({ ...sanitized });
        await newOrder.save();
        const savedOrder = await Order.findOne({ id: newOrder.id }).lean();
        return res.status(201).json(savedOrder);
    } catch (error) {
        if (handleValidationError(error, res)) return;
        console.error('Error creating order:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all orders for a specific user
app.get('/api/orders/:userID', requireAuth, async (req, res) => {
    try {
        const userId = parseId(req.params.userID, 'User ID');

        if (req.authUser.role !== 'admin' && userId !== req.authUser.id) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const orders = await Order.find({ userId }).sort({ id: -1 }).lean();
        return res.status(200).json(orders);
    } catch (error) {
        if (handleValidationError(error, res)) return;
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
        const itemId = parseId(req.body.itemId, 'Item ID');
        const quantity = sanitizeInteger(req.body.quantity ?? 1, 'Quantity', { min: 1, max: 100 });

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
        if (handleValidationError(error, res)) return;
        console.error('Error adding to cart:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update quantity for one cart item
app.patch('/api/cart/items/:itemId', requireAuth, async (req, res) => {
    try {
        const itemId = parseId(req.params.itemId, 'Item ID');
        const quantity = parseQuantity(req.body.quantity, 'Quantity');

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
        if (handleValidationError(error, res)) return;
        console.error('Error updating cart item:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Remove one item from authenticated user's cart
app.delete('/api/cart/items/:itemId', requireAuth, async (req, res) => {
    try {
        const itemId = parseId(req.params.itemId, 'Item ID');

        const cart = await Cart.findOne({ userId: req.authUser.id });
        if (!cart) {
            return res.status(200).json({ success: true, items: [] });
        }

        cart.items = cart.items.filter((entry) => entry.itemId !== itemId);
        await cart.save();

        const items = await hydrateCartItems(cart);
        return res.status(200).json({ success: true, items });
    } catch (error) {
        if (handleValidationError(error, res)) return;
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
app.use('/api', notFound);

// Global error handler (must be after all routes)
app.use(errorHandler);

// Start server after database connection
const startServer = async () => {
    try {
        const connected = await connectDB();
        if (connected) {
            await seedDatabase();
        } else {
            console.warn('Warning: MongoDB connection failed. Server will start but database operations may fail.');
        }

        httpServer.listen(PORT, () => {
            console.log('Server has started on port ' + PORT);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
