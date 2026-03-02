const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Paths to JSON files
const usersFilePath = path.join(__dirname, 'data', 'users.json');

// Helper functions to read/write JSON files
const readUsers = () => {
    try {
        const data = fs.readFileSync(usersFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writeUsers = (users) => {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Shoply API is running' });
});

// Store items array, posts and deletes will reset on server restart.
let store_items = [
    {
        id: 1,
        name: "Apple iPhone 14 Pro Max",
        description: "The iPhone 14 Pro Max features a stunning 6.7-inch Super Retina XDR display, powered by the A16 Bionic chip for lightning-fast performance. With its advanced camera system, including a 48MP main sensor and improved low-light capabilities, it captures breathtaking photos and videos. The device also offers enhanced battery life, 5G connectivity, and a sleek design that combines durability with elegance.",
        postedBy: "James Smith",
        price: 1099.99,
        hasImage: true,
        imageURL: "/images/products/1.jpg"
    },
    {
        id: 2,
        name: "Samsung Galaxy S23 Ultra",
        description: "The Samsung Galaxy S23 Ultra boasts a 6.8-inch Dynamic AMOLED display with a 120Hz refresh rate, delivering vibrant visuals and smooth scrolling. Powered by the Exynos 2200 or Snapdragon 8 Gen 1 processor, it offers exceptional performance for gaming and multitasking. The phone features a versatile quad-camera setup, including a 108MP main sensor, and supports 5G connectivity for fast data speeds. With its sleek design and long-lasting battery, the Galaxy S23 Ultra is a top-tier flagship device.",
        postedBy: "Emily Johnson",
        price: 1199.99,
        hasImage: true,
        imageURL: "/images/products/2.jpg"
    },
    {
        id: 3,
        name: "Stussy x Nike Air Force 1 Low",
        description: "The Stussy x Nike Air Force 1 Low is a highly sought-after collaboration between the iconic streetwear brand Stussy and Nike. This limited-edition sneaker features a classic Air Force 1 silhouette with premium materials and unique design elements. The shoe boasts a clean white leather upper with subtle Stussy branding, including the signature S logo on the heel and tongue. With its timeless style and exclusive collaboration, the Stussy x Nike Air Force 1 Low is a must-have for sneaker enthusiasts and collectors.",
        postedBy: "Harish Sagar",
        price: 150.00,
        hasImage: true,
        imageURL: "/images/products/3.webp"
    },
    {
        id: 4,
        name: "Sony WH-1000XM4 Wireless Noise-Canceling Headphones",
        description: "The Sony WH-1000XM4 headphones offer industry-leading noise cancellation, providing an immersive listening experience. With up to 30 hours of battery life and quick charging capabilities, you can enjoy your music all day long. The headphones feature a comfortable design with plush ear cups and adaptive sound control that adjusts to your environment. Additionally, they support high-resolution audio and have a built-in microphone for clear calls. Whether you're commuting, working, or relaxing, the Sony WH-1000XM4 is the perfect companion for your audio needs.",
        postedBy: "Michael Brown",
        price: 349.99,
        hasImage: true,
        imageURL: "/images/products/4.jpg"
    },
    {
        id: 5,
        name: "Nvidia GeForce RTX 5090 Graphics Card",
        description: "The Nvidia GeForce RTX 5090 is a high-performance graphics card designed for gamers and content creators. It features the latest Ampere architecture, delivering exceptional performance and ray tracing capabilities. With its massive 24GB of GDDR6X memory, the RTX 5090 can handle even the most demanding games and applications with ease. The card also supports DLSS (Deep Learning Super Sampling) technology, which enhances performance while maintaining visual quality. Whether you're gaming at 4K resolution or working on intensive creative projects, the Nvidia GeForce RTX 5090 is a powerhouse that delivers stunning visuals and smooth performance.",
        postedBy: "Jensen Huang",
        price: 3499.99,
        hasImage: true,
        imageURL: "/images/products/5.jpg"
    },
    {
        id: 6,
        name: "Apple MacBook Pro 16-inch (2023)",
        description: "The Apple MacBook Pro 16-inch (2023) is a powerhouse laptop designed for professionals and creatives. It features a stunning Retina display with True Tone technology, providing vibrant colors and sharp details. Powered by the M2 Pro or M2 Max chip, it delivers exceptional performance for demanding tasks such as video editing, 3D rendering, and software development. The MacBook Pro also offers an improved keyboard, enhanced thermal management, and a long-lasting battery, making it an ideal choice for those who need a reliable and high-performance machine for their work.",
        postedBy: "Bob Williams",
        price: 2499.99,
        hasImage: true,
        imageURL: "/images/products/6.jpg"
    },
    {
        id: 7,
        name: "Sony PlayStation 5",
        description: "The Sony PlayStation 5 is the latest generation of gaming console, offering a powerful gaming experience with its custom AMD Zen 2 processor and RDNA 2 graphics architecture. The PS5 features a sleek design and comes with a new DualSense controller that provides haptic feedback and adaptive triggers for immersive gameplay. With its ultra-fast SSD, the console allows for quick loading times and seamless transitions between games. The PS5 also supports ray tracing, 4K gaming, and backward compatibility with a wide range of PS4 games, making it a must-have for gamers looking to experience the next level of gaming performance.",
        postedBy: "Shawn Layden",
        price: 499.99,
        hasImage: true,
        imageURL: "/images/products/7.webp"
    },
    {
        id: 8,
        name: "Apple AirPods Pro (2nd Generation)",
        description: "The Apple AirPods Pro (2nd Generation) offer an enhanced audio experience with active noise cancellation and a customizable fit. These wireless earbuds feature a new H1 chip that provides improved performance and connectivity. The AirPods Pro also include a transparency mode that allows you to hear your surroundings while still enjoying your music. With up to 4.5 hours of listening time on a single charge and a wireless charging case that provides additional battery life, the AirPods Pro are perfect for on-the-go use and offer seamless integration with Apple devices.",
        postedBy: "Lisa Anderson",
        price: 249.99,
        hasImage: true,
        imageURL: "/images/products/8.jpg"
    },
    {
        id: 9,
        name: "Modern Style Dining Table Set",
        description: "This modern style dining table set features a sleek and minimalist design, perfect for contemporary dining spaces. The set includes a sturdy rectangular table with a smooth surface and four matching chairs with comfortable cushioned seats. The table is made from high-quality materials, ensuring durability and stability, while the chairs provide ergonomic support for long meals and gatherings. With its clean lines and neutral color palette, this dining table set will complement a variety of interior styles and create a stylish and inviting atmosphere in your dining area.",
        postedBy: "Sarah Davis",
        price: 799.99,
        hasImage: true,
        imageURL: "/images/products/9.avif"
    }
];

// API Routes

// Get all store items
app.get('/api/items', (req, res) => {
    return res.status(200).json(store_items);
});

// Get single item
app.get('/api/items/:id', (req, res) => {
    const item = store_items.find(i => i.id === parseInt(req.params.id));
    if (item) {
        return res.status(200).json(item);
    }

    return res.status(404).json({ success: false, message: 'Item not found' });
});

// Create new store item
app.post('/api/items', (req, res) => {
    const { name, description, postedBy, price, hasImage, imageURL } = req.body;

    if (!name || typeof price === 'undefined') {
        return res.status(400).json({ success: false, message: 'Missing required fields: name, price' });
    }

    // Auto increment ID based on existing items
    const nextId = store_items.reduce((max, it) => Math.max(max, it.id), 0) + 1;
    const newItem = {
        id: nextId,
        name,
        description: description || '',
        postedBy: postedBy || 'admin',
        price: Number(price),
        hasImage: !!hasImage,
        imageURL: imageURL || ''
    };

    store_items.push(newItem);
    console.log('Item added:', newItem.id, newItem.name);

    return res.status(201).json(newItem);
});

// Update item endpoint
app.put('/api/items/:id', (req, res) => {
    const itemId = parseInt(req.params.id);
    const itemIndex = store_items.findIndex(i => i.id === itemId);

    if (itemIndex === -1) {
        return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const { name, description, postedBy, price, hasImage, imageURL } = req.body;

    // Update only provided fields
    if (name !== undefined) store_items[itemIndex].name = name;
    if (description !== undefined) store_items[itemIndex].description = description;
    if (postedBy !== undefined) store_items[itemIndex].postedBy = postedBy;
    if (price !== undefined) store_items[itemIndex].price = Number(price);
    if (hasImage !== undefined) store_items[itemIndex].hasImage = !!hasImage;
    if (imageURL !== undefined) store_items[itemIndex].imageURL = imageURL;

    console.log('Item updated:', itemId, store_items[itemIndex].name);
    return res.status(200).json(store_items[itemIndex]);
});

// Delete item endpoint
app.delete('/api/items/:id', (req, res) => {
    const itemId = parseInt(req.params.id);
    const itemIndex = store_items.findIndex(i => i.id === itemId);

    if (itemIndex === -1) {
        return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const deletedItem = store_items.splice(itemIndex, 1);
    console.log('Item deleted:', itemId, deletedItem[0].name);
    // Return 204 No Content to indicate successful deletion
    return res.status(204).end();
});

// Register user endpoint
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;

    const users = readUsers();

    // Basic input validation
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Missing name, email or password' });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        // Conflict
        return res.status(409).json({ success: false, message: 'User already exists' });
    }

    // Create new user
    const newUser = {
        id: users.length + 1,
        name,
        email,
        password
    };

    users.push(newUser);
    writeUsers(users);

    console.log('New user registered:', { name, email });

    return res.status(201).json({ success: true, message: 'Registration successful! You can now login.' });
});

// User login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const users = readUsers();

    // Find user
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        console.log('User logged in:', email);
        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            user: { id: user.id, name: user.name, email: user.email }
        });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
});

app.listen(PORT, () => {
    console.log("Server has started on port " + PORT);
});