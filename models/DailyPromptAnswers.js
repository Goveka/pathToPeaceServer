const mongoose = require('mongoose');

const DailyPromptAnswers = new mongoose.Schema({
    day: Number,
    userId: String,
    username: String,
    answers: Array,
})

module.exports = mongoose.model('DailyPromptAnswers', DailyPromptAnswers);
