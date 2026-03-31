const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Cart = require('../models/Cart');
const { requireAuth } = require('../middleware/auth');
const {
    RequestValidationError,
    sanitizeItemPayload,
    sanitizeItemQuery,
    sanitizeInteger
} = require('../utils/validation');

const handleValidationError = (error, res) => {
    if (error instanceof RequestValidationError) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
    return null;
};

// Get all store items
router.get('/', async (req, res) => {
    try {
        const { filter, sortOption } = sanitizeItemQuery(req.query);

        const items = await Item.find(filter)
            .sort(sortOption)
            .lean();

        return res.status(200).json(items);

    } catch (error) {
        if (handleValidationError(error, res)) return;
        console.error('Error fetching items:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single item
router.get('/:id', async (req, res) => {
    try {
        const itemId = sanitizeInteger(req.params.id, 'Item ID', { min: 1, max: 1_000_000_000 });

        const item = await Item.findOne({ id: itemId }).lean();
        if (item) {
            return res.status(200).json(item);
        }
        return res.status(404).json({ success: false, message: 'Item not found' });
    } catch (error) {
        if (handleValidationError(error, res)) return;
        console.error('Error fetching item:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create new store item
router.post('/', requireAuth, async (req, res) => {
    try {
        const sanitized = sanitizeItemPayload(req.body);
        const ownerId = req.authUser.role === 'admin'
            ? (sanitized.userId || req.authUser.id)
            : req.authUser.id;

        const newItem = new Item({
            name: sanitized.name,
            description: sanitized.description || '',
            postedBy: sanitized.postedBy || req.authUser.name,
            userId: ownerId,
            price: sanitized.price,
            hasImage: sanitized.hasImage,
            imageURL: sanitized.imageURL || ''
        });

        await newItem.save();
        console.log('Item added:', newItem.id, newItem.name);

        // Return lean object
        const savedItem = await Item.findOne({ id: newItem.id }).lean();
        return res.status(201).json(savedItem);

    } catch (error) {
        if (handleValidationError(error, res)) return;
        console.error('Error adding item:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update item endpoint
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const itemId = sanitizeInteger(req.params.id, 'Item ID', { min: 1, max: 1_000_000_000 });
        const sanitized = sanitizeItemPayload(req.body, { partial: true });

        const item = await Item.findOne({ id: itemId });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        if (req.authUser.role !== 'admin' && item.userId !== req.authUser.id) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        // Update only provided fields
        if (sanitized.name !== undefined) item.name = sanitized.name;
        if (sanitized.description !== undefined) item.description = sanitized.description;
        if (sanitized.postedBy !== undefined) item.postedBy = sanitized.postedBy;
        if (sanitized.userId !== undefined && req.authUser.role === 'admin') {
            item.userId = sanitized.userId;
        }
        if (sanitized.price !== undefined) item.price = sanitized.price;
        if (sanitized.hasImage !== undefined) item.hasImage = sanitized.hasImage;
        if (sanitized.imageURL !== undefined) item.imageURL = sanitized.imageURL;

        await item.save();
        console.log('Item updated:', itemId, item.name);

        const updatedItem = await Item.findOne({ id: itemId }).lean();
        return res.status(200).json(updatedItem);

    } catch (error) {
        if (handleValidationError(error, res)) return;
        console.error('Error updating item:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete item endpoint
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const itemId = sanitizeInteger(req.params.id, 'Item ID', { min: 1, max: 1_000_000_000 });
        const existing = await Item.findOne({ id: itemId }).lean();
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        if (req.authUser.role !== 'admin' && existing.userId !== req.authUser.id) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const result = await Item.findOneAndDelete({ id: itemId });

        await Cart.updateMany({}, { $pull: { items: { itemId } } });

        console.log('Item deleted:', itemId, result.name);
        return res.status(204).end();

    } catch (error) {
        if (handleValidationError(error, res)) return;
        console.error('Error deleting item:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

