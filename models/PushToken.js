const mongoose = require('mongoose');

const PushTokenSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // Ensures only one token per user
    pushToken: { type: String, required: true },
});

module.exports = mongoose.model('PushToken', PushTokenSchema);