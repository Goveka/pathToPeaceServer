const mongoose = require('mongoose');


const PasswordResetTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now() },
    expiresAt: { type: Date, default: () => Date.now() + 24 * 60 * 60 * 1000 }, // 24 hours
  });
  
  module.exports = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);
  