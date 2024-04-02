const mongoose = require('mongoose');

const DailyPrompt = new mongoose.Schema({
    day: Number,
    prompt: String
})

module.exports = mongoose.model('DailyPrompt', DailyPrompt);