const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
    password: { type: String, required: true, minlength: 8, maxlength: 256 },
    role: { type: String, enum: ['admin', 'user'], default: 'user' }    
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
