const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    userId: { type: Number, required: true, ref: 'User' },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    address: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    postalCode: { type: String, required: true, trim: true, maxlength: 12 },
    cardName: { type: String, required: true, trim: true, maxlength: 80 },
    cardNumber: { type: String, required: true, trim: true, maxlength: 25 }, // store masked form only
    expiryDate: { type: String, default: '', maxlength: 7 },
    cvv: { type: String, default: '', maxlength: 4, select: false },
    totalPrice: { type: Number, required: true, min: 0.01, max: 1_000_000 },
    items: { type: Array, required: true, validate: [(value) => Array.isArray(value) && value.length <= 100, 'Too many order items'] },
}, { timestamps: true });

// Auto-increment ID pre-validate hook
orderSchema.pre('validate', async function () {
    if (!this.isNew || this.id) {
        return;
    }
    const lastOrder = await this.constructor.findOne({}, {}, { sort: { 'id': -1 } });
    if (lastOrder && lastOrder.id) {
        this.id = lastOrder.id + 1;
    } else {
        this.id = 1; // Start from 1 if no orders exist
    }
});

module.exports = mongoose.model('Order', orderSchema);
