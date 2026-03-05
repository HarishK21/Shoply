const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    userId: { type: Number, required: true, ref: 'User' },
    email: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    cardName: { type: String, required: true },
    cardNumber: { type: String, required: true },
    expiryDate: { type: String, required: true },
    cvv: { type: String, required: true },
    totalPrice: { type: Number, required: true },
    items: { type: Array, required: true },
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