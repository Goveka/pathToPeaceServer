// models/PasswordResetToken.js
const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 * 1000, // 24 hours
  },
});

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
