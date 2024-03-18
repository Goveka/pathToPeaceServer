const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  daysInAYear: Number,
  day: Number,
  username: String,
  email: String,
  password: String, // Store hashed password
  country: String,
  city: String,
  dateOfBirth: String,
});

module.exports = mongoose.model('User', userSchema);