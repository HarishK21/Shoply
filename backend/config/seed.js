const Item = require('../models/Item');
const User = require('../models/User');
const { hashPassword } = require('../utils/auth');
const fs = require('fs');
const path = require('path');

const PUBLIC_SEED_FILE = path.join(__dirname, '../data/users.json');

const normalizeSeedUsers = (entries) => entries
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => {
        const id = Number.parseInt(entry.id, 10);
        const name = String(entry.name || '').trim();
        const email = String(entry.email || '').trim().toLowerCase();
        const password = String(entry.password || '');
        const role = entry.role === 'admin' ? 'admin' : 'user';

        if (!name || !email || !password) {
            return null;
        }

        const normalized = {
            name,
            email,
            password: hashPassword(password),
            role
        };

        if (Number.isInteger(id) && id > 0) {
            normalized.id = id;
        }

        return normalized;
    })
    .filter(Boolean);

const parseFileSeedUsers = () => {
    if (!fs.existsSync(PUBLIC_SEED_FILE)) {
        return [];
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(PUBLIC_SEED_FILE, 'utf8'));
        if (!Array.isArray(parsed)) {
            console.warn('Seed file is not an array. Skipping file-based user seed.');
            return [];
        }
        return normalizeSeedUsers(parsed);
    } catch (error) {
        console.warn('Failed to parse seed user file. Skipping file-based user seed.');
        return [];
    }
};

const parseSeedUsers = () => {
    const raw = process.env.SEED_USERS_JSON;
    if (!raw) {
        return parseFileSeedUsers();
    }

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            console.warn('SEED_USERS_JSON is not an array. Skipping user seed.');
            return [];
        }

        return normalizeSeedUsers(parsed);
    } catch (error) {
        console.warn('SEED_USERS_JSON is invalid JSON. Skipping user seed.');
        return [];
    }
};

// Initial data to seed if DB is empty
const initialItems = [
    {
        name: "Apple iPhone 14 Pro Max",
        description: "The iPhone 14 Pro Max features a stunning 6.7-inch Super Retina XDR display, powered by the A16 Bionic chip for lightning-fast performance. With its advanced camera system, including a 48MP main sensor and improved low-light capabilities, it captures breathtaking photos and videos. The device also offers enhanced battery life, 5G connectivity, and a sleek design that combines durability with elegance.",
        postedBy: "James Smith",
        userId: 1,
        price: 1099.99,
        hasImage: true,
        imageURL: "/images/products/1.jpg"
    },
    {
        name: "Samsung Galaxy S23 Ultra",
        description: "The Samsung Galaxy S23 Ultra boasts a 6.8-inch Dynamic AMOLED display with a 120Hz refresh rate, delivering vibrant visuals and smooth scrolling. Powered by the Exynos 2200 or Snapdragon 8 Gen 1 processor, it offers exceptional performance for gaming and multitasking. The phone features a versatile quad-camera setup, including a 108MP main sensor, and supports 5G connectivity for fast data speeds. With its sleek design and long-lasting battery, the Galaxy S23 Ultra is a top-tier flagship device.",
        postedBy: "Emily Johnson",
        userId: 2,
        price: 1199.99,
        hasImage: true,
        imageURL: "/images/products/2.jpg"
    },
    {
        name: "Stussy x Nike Air Force 1 Low",
        description: "The Stussy x Nike Air Force 1 Low is a highly sought-after collaboration between the iconic streetwear brand Stussy and Nike. This limited-edition sneaker features a classic Air Force 1 silhouette with premium materials and unique design elements. The shoe boasts a clean white leather upper with subtle Stussy branding, including the signature S logo on the heel and tongue. With its timeless style and exclusive collaboration, the Stussy x Nike Air Force 1 Low is a must-have for sneaker enthusiasts and collectors.",
        postedBy: "Harish Sagar",
        userId: 1,
        price: 150.00,
        hasImage: true,
        imageURL: "/images/products/3.webp"
    },
    {
        name: "Sony WH-1000XM4 Wireless Noise-Canceling Headphones",
        description: "The Sony WH-1000XM4 headphones offer industry-leading noise cancellation, providing an immersive listening experience. With up to 30 hours of battery life and quick charging capabilities, you can enjoy your music all day long. The headphones feature a comfortable design with plush ear cups and adaptive sound control that adjusts to your environment. Additionally, they support high-resolution audio and have a built-in microphone for clear calls. Whether you're commuting, working, or relaxing, the Sony WH-1000XM4 is the perfect companion for your audio needs.",
        postedBy: "Michael Brown",
        userId: 3,
        price: 349.99,
        hasImage: true,
        imageURL: "/images/products/4.jpg"
    },
    {
        name: "Nvidia GeForce RTX 5090 Graphics Card",
        description: "The Nvidia GeForce RTX 5090 is a high-performance graphics card designed for gamers and content creators. It features the latest Ampere architecture, delivering exceptional performance and ray tracing capabilities. With its massive 24GB of GDDR6X memory, the RTX 5090 can handle even the most demanding games and applications with ease. The card also supports DLSS (Deep Learning Super Sampling) technology, which enhances performance while maintaining visual quality. Whether you're gaming at 4K resolution or working on intensive creative projects, the Nvidia GeForce RTX 5090 is a powerhouse that delivers stunning visuals and smooth performance.",
        postedBy: "Jensen Huang",
        userId: 4,
        price: 3499.99,
        hasImage: true,
        imageURL: "/images/products/5.jpg"
    },
    {
        name: "Apple MacBook Pro 16-inch (2023)",
        description: "The Apple MacBook Pro 16-inch (2023) is a powerhouse laptop designed for professionals and creatives. It features a stunning Retina display with True Tone technology, providing vibrant colors and sharp details. Powered by the M2 Pro or M2 Max chip, it delivers exceptional performance for demanding tasks such as video editing, 3D rendering, and software development. The MacBook Pro also offers an improved keyboard, enhanced thermal management, and a long-lasting battery, making it an ideal choice for those who need a reliable and high-performance machine for their work.",
        postedBy: "Bob Williams",
        userId: 5,
        price: 2499.99,
        hasImage: true,
        imageURL: "/images/products/6.jpg"
    },
    {
        name: "Sony PlayStation 5",
        description: "The Sony PlayStation 5 is the latest generation of gaming console, offering a powerful gaming experience with its custom AMD Zen 2 processor and RDNA 2 graphics architecture. The PS5 features a sleek design and comes with a new DualSense controller that provides haptic feedback and adaptive triggers for immersive gameplay. With its ultra-fast SSD, the console allows for quick loading times and seamless transitions between games. The PS5 also supports ray tracing, 4K gaming, and backward compatibility with a wide range of PS4 games, making it a must-have for gamers looking to experience the next level of gaming performance.",
        postedBy: "Shawn Layden",
        userId: 2,
        price: 499.99,
        hasImage: true,
        imageURL: "/images/products/7.webp"
    },
    {
        name: "Apple AirPods Pro (2nd Generation)",
        description: "The Apple AirPods Pro (2nd Generation) offer an enhanced audio experience with active noise cancellation and a customizable fit. These wireless earbuds feature a new H1 chip that provides improved performance and connectivity. The AirPods Pro also include a transparency mode that allows you to hear your surroundings while still enjoying your music. With up to 4.5 hours of listening time on a single charge and a wireless charging case that provides additional battery life, the AirPods Pro are perfect for on-the-go use and offer seamless integration with Apple devices.",
        postedBy: "Lisa Anderson",
        userId: 3,
        price: 249.99,
        hasImage: true,
        imageURL: "/images/products/8.jpg"
    },
    {
        name: "Modern Style Dining Table Set",
        description: "This modern style dining table set features a sleek and minimalist design, perfect for contemporary dining spaces. The set includes a sturdy rectangular table with a smooth surface and four matching chairs with comfortable cushioned seats. The table is made from high-quality materials, ensuring durability and stability, while the chairs provide ergonomic support for long meals and gatherings. With its clean lines and neutral color palette, this dining table set will complement a variety of interior styles and create a stylish and inviting atmosphere in your dining area.",
        postedBy: "Sarah Davis",
        userId: 4,
        price: 799.99,
        hasImage: true,
        imageURL: "/images/products/9.avif"
    }
];

// Seed Database Function
const seedDatabase = async () => {
    try {
        const initialUsers = parseSeedUsers();

        // Seed users
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            if (initialUsers.length === 0) {
                console.log('No users found and no valid seed source was provided. Skipping user seed.');
            } else {
                console.log('No users found. Seeding initial users...');
                for (let i = 0; i < initialUsers.length; i++) {
                    const newUser = new User(initialUsers[i]);
                    await newUser.save();
                }
                console.log(`Seeded ${initialUsers.length} users successfully!`);
            }
        } else {
            console.log(`Database already has ${userCount} users. Skipping user seed.`);
        }

        // Seed items
        const itemCount = await Item.countDocuments();
        if (itemCount === 0) {
            console.log('No items found. Seeding initial items...');
            // Loop sequentially to ensure auto-increment ID hook works correctly in order
            for (let i = 0; i < initialItems.length; i++) {
                const newItem = new Item(initialItems[i]);
                await newItem.save();
            }
            console.log(`Seeded ${initialItems.length} items successfully!`);
        } else {
            console.log(`Database already has ${itemCount} items. Skipping item seed.`);
        }
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

module.exports = seedDatabase;

