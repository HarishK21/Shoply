const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}, { timestamps: true });

// Auto-increment ID pre-validate hook
userSchema.pre('validate', async function () {
    if (!this.isNew || this.id) {
        return;
    }
    const lastUser = await this.constructor.findOne({}, {}, { sort: { 'id': -1 } });
    if (lastUser && lastUser.id) {
        this.id = lastUser.id + 1;
    } else {
        this.id = 1;
    }
});

module.exports = mongoose.model('User', userSchema);
