require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const Item = require('./models/Item');
const User = require('./models/User');
const Cart = require('./models/Cart');
const AuthSession = require('./models/AuthSession');

const PORT = Number(process.env.PORT) || 8080;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Shoply';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB (Shoply database)');
        seedDatabase();
    })
    .catch((err) => console.error('MongoDB connection error:', err));

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
            email: user.email
        };
        req.tokenHash = tokenHash;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Initial data to seed if DB is empty
const initialItems = [
    {
        name: 'Apple iPhone 14 Pro Max',
        description: 'The iPhone 14 Pro Max features a stunning 6.7-inch Super Retina XDR display, powered by the A16 Bionic chip for lightning-fast performance. With its advanced camera system, including a 48MP main sensor and improved low-light capabilities, it captures breathtaking photos and videos. The device also offers enhanced battery life, 5G connectivity, and a sleek design that combines durability with elegance.',
        postedBy: 'James Smith',
        price: 1099.99,
        hasImage: true,
        imageURL: '/images/products/1.jpg'
    },
    {
        name: 'Samsung Galaxy S23 Ultra',
        description: 'The Samsung Galaxy S23 Ultra boasts a 6.8-inch Dynamic AMOLED display with a 120Hz refresh rate, delivering vibrant visuals and smooth scrolling. Powered by the Exynos 2200 or Snapdragon 8 Gen 1 processor, it offers exceptional performance for gaming and multitasking. The phone features a versatile quad-camera setup, including a 108MP main sensor, and supports 5G connectivity for fast data speeds. With its sleek design and long-lasting battery, the Galaxy S23 Ultra is a top-tier flagship device.',
        postedBy: 'Emily Johnson',
        price: 1199.99,
        hasImage: true,
        imageURL: '/images/products/2.jpg'
    },
    {
        name: 'Stussy x Nike Air Force 1 Low',
        description: 'The Stussy x Nike Air Force 1 Low is a highly sought-after collaboration between the iconic streetwear brand Stussy and Nike. This limited-edition sneaker features a classic Air Force 1 silhouette with premium materials and unique design elements. The shoe boasts a clean white leather upper with subtle Stussy branding, including the signature S logo on the heel and tongue. With its timeless style and exclusive collaboration, the Stussy x Nike Air Force 1 Low is a must-have for sneaker enthusiasts and collectors.',
        postedBy: 'Harish Sagar',
        price: 150.00,
        hasImage: true,
        imageURL: '/images/products/3.webp'
    },
    {
        name: 'Sony WH-1000XM4 Wireless Noise-Canceling Headphones',
        description: 'The Sony WH-1000XM4 headphones offer industry-leading noise cancellation, providing an immersive listening experience. With up to 30 hours of battery life and quick charging capabilities, you can enjoy your music all day long. The headphones feature a comfortable design with plush ear cups and adaptive sound control that adjusts to your environment. Additionally, they support high-resolution audio and have a built-in microphone for clear calls. Whether you are commuting, working, or relaxing, the Sony WH-1000XM4 is the perfect companion for your audio needs.',
        postedBy: 'Michael Brown',
        price: 349.99,
        hasImage: true,
        imageURL: '/images/products/4.jpg'
    },
    {
        name: 'Nvidia GeForce RTX 5090 Graphics Card',
        description: 'The Nvidia GeForce RTX 5090 is a high-performance graphics card designed for gamers and content creators. It features the latest Ampere architecture, delivering exceptional performance and ray tracing capabilities. With its massive 24GB of GDDR6X memory, the RTX 5090 can handle even the most demanding games and applications with ease. The card also supports DLSS (Deep Learning Super Sampling) technology, which enhances performance while maintaining visual quality. Whether you are gaming at 4K resolution or working on intensive creative projects, the Nvidia GeForce RTX 5090 is a powerhouse that delivers stunning visuals and smooth performance.',
        postedBy: 'Jensen Huang',
        price: 3499.99,
        hasImage: true,
        imageURL: '/images/products/5.jpg'
    },
    {
        name: 'Apple MacBook Pro 16-inch (2023)',
        description: 'The Apple MacBook Pro 16-inch (2023) is a powerhouse laptop designed for professionals and creatives. It features a stunning Retina display with True Tone technology, providing vibrant colors and sharp details. Powered by the M2 Pro or M2 Max chip, it delivers exceptional performance for demanding tasks such as video editing, 3D rendering, and software development. The MacBook Pro also offers an improved keyboard, enhanced thermal management, and a long-lasting battery, making it an ideal choice for those who need a reliable and high-performance machine for their work.',
        postedBy: 'Bob Williams',
        price: 2499.99,
        hasImage: true,
        imageURL: '/images/products/6.jpg'
    },
    {
        name: 'Sony PlayStation 5',
        description: 'The Sony PlayStation 5 is the latest generation of gaming console, offering a powerful gaming experience with its custom AMD Zen 2 processor and RDNA 2 graphics architecture. The PS5 features a sleek design and comes with a new DualSense controller that provides haptic feedback and adaptive triggers for immersive gameplay. With its ultra-fast SSD, the console allows for quick loading times and seamless transitions between games. The PS5 also supports ray tracing, 4K gaming, and backward compatibility with a wide range of PS4 games, making it a must-have for gamers looking to experience the next level of gaming performance.',
        postedBy: 'Shawn Layden',
        price: 499.99,
        hasImage: true,
        imageURL: '/images/products/7.webp'
    },
    {
        name: 'Apple AirPods Pro (2nd Generation)',
        description: 'The Apple AirPods Pro (2nd Generation) offer an enhanced audio experience with active noise cancellation and a customizable fit. These wireless earbuds feature a new H1 chip that provides improved performance and connectivity. The AirPods Pro also include a transparency mode that allows you to hear your surroundings while still enjoying your music. With up to 4.5 hours of listening time on a single charge and a wireless charging case that provides additional battery life, the AirPods Pro are perfect for on-the-go use and offer seamless integration with Apple devices.',
        postedBy: 'Lisa Anderson',
        price: 249.99,
        hasImage: true,
        imageURL: '/images/products/8.jpg'
    },
    {
        name: 'Modern Style Dining Table Set',
        description: 'This modern style dining table set features a sleek and minimalist design, perfect for contemporary dining spaces. The set includes a sturdy rectangular table with a smooth surface and four matching chairs with comfortable cushioned seats. The table is made from high-quality materials, ensuring durability and stability, while the chairs provide ergonomic support for long meals and gatherings. With its clean lines and neutral color palette, this dining table set will complement a variety of interior styles and create a stylish and inviting atmosphere in your dining area.',
        postedBy: 'Sarah Davis',
        price: 799.99,
        hasImage: true,
        imageURL: '/images/products/9.avif'
    }
];

// Seed Database Function
const seedDatabase = async () => {
    try {
        const count = await Item.countDocuments();
        if (count === 0) {
            console.log('Database empty. Seeding initial items...');
            // Loop sequentially to ensure auto-increment ID hook works correctly in order
            for (let i = 0; i < initialItems.length; i++) {
                const newItem = new Item(initialItems[i]);
                await newItem.save();
            }
            console.log('Database seeded successfully!');
        } else {
            console.log(`Database already populated with ${count} items. Skipping seed.`);
        }
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Shoply API is running' });
});

// API Routes

// Get all store items
app.get('/api/items', async (req, res) => {
    try {
        const items = await Item.find({}).sort({ id: 1 }).lean();
        return res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single item
app.get('/api/items/:id', async (req, res) => {
    try {
        const itemId = parseIntParam(req.params.id);
        if (itemId === null) {
            return res.status(400).json({ success: false, message: 'Invalid item id' });
        }

        const item = await Item.findOne({ id: itemId }).lean();
        if (item) {
            return res.status(200).json(item);
        }
        return res.status(404).json({ success: false, message: 'Item not found' });
    } catch (error) {
        console.error('Error fetching item:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create new store item
app.post('/api/items', async (req, res) => {
    try {
        const { name, description, postedBy, price, hasImage, imageURL } = req.body;

        if (!name || typeof price === 'undefined') {
            return res.status(400).json({ success: false, message: 'Missing required fields: name, price' });
        }

        const newItem = new Item({
            name,
            description: description || '',
            postedBy: postedBy || 'admin',
            price: Number(price),
            hasImage: !!hasImage,
            imageURL: imageURL || ''
        });

        await newItem.save();
        console.log('Item added:', newItem.id, newItem.name);

        // Return lean object
        const savedItem = await Item.findOne({ id: newItem.id }).lean();
        return res.status(201).json(savedItem);
    } catch (error) {
        console.error('Error adding item:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update item endpoint
app.put('/api/items/:id', async (req, res) => {
    try {
        const itemId = parseIntParam(req.params.id);
        if (itemId === null) {
            return res.status(400).json({ success: false, message: 'Invalid item id' });
        }

        const { name, description, postedBy, price, hasImage, imageURL } = req.body;
        const item = await Item.findOne({ id: itemId });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Update only provided fields
        if (name !== undefined) item.name = name;
        if (description !== undefined) item.description = description;
        if (postedBy !== undefined) item.postedBy = postedBy;
        if (price !== undefined) item.price = Number(price);
        if (hasImage !== undefined) item.hasImage = !!hasImage;
        if (imageURL !== undefined) item.imageURL = imageURL;

        await item.save();
        console.log('Item updated:', itemId, item.name);

        const updatedItem = await Item.findOne({ id: itemId }).lean();
        return res.status(200).json(updatedItem);
    } catch (error) {
        console.error('Error updating item:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete item endpoint
app.delete('/api/items/:id', async (req, res) => {
    try {
        const itemId = parseIntParam(req.params.id);
        if (itemId === null) {
            return res.status(400).json({ success: false, message: 'Invalid item id' });
        }

        const result = await Item.findOneAndDelete({ id: itemId });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Remove deleted products from all user carts.
        await Cart.updateMany({}, { $pull: { items: { itemId } } });

        console.log('Item deleted:', itemId, result.name);
        return res.status(204).end();
    } catch (error) {
        console.error('Error deleting item:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

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

        // One active session per user to keep state simple for this app.
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
            user: { id: user.id, name: user.name, email: user.email }
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

// 404 Fallback for unknown API routes
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
});

app.listen(PORT, () => {
    console.log('Server has started on port ' + PORT);
});
