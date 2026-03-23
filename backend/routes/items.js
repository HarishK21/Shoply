const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Cart = require('../models/Cart');

const parseIntParam = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : null;
};

// Get all store items
router.get('/', async (req, res) => {
    try {
        const { minPrice, maxPrice, sort } = req.query;

        let filter = {};

        if (minPrice || maxPrice) {
            filter.price = {};

            if (minPrice) {
                filter.price.$gte = Number(minPrice);
            }

            if (maxPrice) {
                filter.price.$lte = Number(maxPrice);
            }
        }

        let sortOption = { id: 1 }; 

        if (sort === 'price_asc') {
            sortOption = { price: 1 };
        } else if (sort === 'price_desc') {
            sortOption = { price: -1 };
        } else if (sort === 'newest') {
            sortOption = { createdAt: -1 };
        }

        const items = await Item.find(filter)
            .sort(sortOption)
            .lean();

        return res.status(200).json(items);

    } catch (error) {
        console.error('Error fetching items:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single item
router.get('/:id', async (req, res) => {
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
router.post('/', async (req, res) => {
    try {
        const { name, description, postedBy, userId, price, hasImage, imageURL } = req.body;
        const normalizedUserId = parseIntParam(userId);

        if (!name || typeof price === 'undefined' || normalizedUserId === null) {
            return res.status(400).json({ success: false, message: 'Missing required fields: name, userId, price' });
        }

        const newItem = new Item({
            name,
            description: description || '',
            postedBy: postedBy || 'admin',
            userId: normalizedUserId,
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
router.put('/:id', async (req, res) => {
    try {
        const itemId = parseIntParam(req.params.id);
        if (itemId === null) {
            return res.status(400).json({ success: false, message: 'Invalid item id' });
        }

        const { name, description, postedBy, userId, price, hasImage, imageURL } = req.body;

        const item = await Item.findOne({ id: itemId });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Update only provided fields
        if (name !== undefined) item.name = name;
        if (description !== undefined) item.description = description;
        if (postedBy !== undefined) item.postedBy = postedBy;
        if (userId !== undefined) {
            const normalizedUserId = parseIntParam(userId);
            if (normalizedUserId === null) {
                return res.status(400).json({ success: false, message: 'Invalid userId' });
            }
            item.userId = normalizedUserId;
        }
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
router.delete('/:id', async (req, res) => {
    try {
        const itemId = parseIntParam(req.params.id);
        if (itemId === null) {
            return res.status(400).json({ success: false, message: 'Invalid item id' });
        }

        const result = await Item.findOneAndDelete({ id: itemId });

        if (!result) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        await Cart.updateMany({}, { $pull: { items: { itemId } } });

        console.log('Item deleted:', itemId, result.name);
        return res.status(204).end();

    } catch (error) {
        console.error('Error deleting item:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

