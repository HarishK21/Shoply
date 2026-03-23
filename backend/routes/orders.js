const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Create new order (POST /api/order)
router.post('/order', async (req, res) => {
    try {
        const { firstName, lastName, userId, email, address, city, postalCode, cardName, cardNumber, cardExpiry, cardCVV, totalPrice, items } = req.body;

        if (!firstName || !lastName || !userId || !email || !address || !city || !postalCode || !cardName || !cardNumber || !cardExpiry || !cardCVV || !totalPrice || !items) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const newOrder = new Order({
            firstName,
            lastName,
            userId,
            email,
            address,
            city,
            postalCode,
            cardName,
            cardNumber,
            expiryDate: cardExpiry,
            cvv: cardCVV,
            totalPrice,
            items
        }); 

        await newOrder.save();
        console.log('Order created:', newOrder.id);

        const savedOrder = await Order.findOne({ id: newOrder.id }).lean();
        return res.status(201).json(savedOrder);

    } catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all orders for a specific user (GET /api/orders/:userID)
router.get('/orders/:userID', async (req, res) => {
    try {
        const userId = parseInt(req.params.userID);

        if (isNaN(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const orders = await Order.find({ userId: userId })
            .sort({ id: -1 })
            .lean();

        return res.status(200).json(orders);

    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

