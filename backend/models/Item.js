const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    postedBy: { type: String, default: 'admin' },
    userId: { type: Number, required: true, ref: 'User' },
    price: { type: Number, required: true },
    hasImage: { type: Boolean, default: false },
    imageURL: { type: String, default: '' },
}, { timestamps: true });

// Auto-increment ID pre-validate hook
itemSchema.pre('validate', async function () {
    if (!this.isNew || this.id) {
        return;
    }
    const lastItem = await this.constructor.findOne({}, {}, { sort: { 'id': -1 } });
    if (lastItem && lastItem.id) {
        this.id = lastItem.id + 1;
    } else {
        this.id = 1; // Start from 1 if no items exist
    }
});

module.exports = mongoose.model('Item', itemSchema);
