const mongoose = require('mongoose');

const DailyPromptAnswers = new mongoose.Schema({
    day: Number,
    userId: String,
    username: String,
    firstQ: String,
    secondQ: String,
    thirdQ: String,
    fourthQ: String,
    fifthQ: String
})

module.exports = mongoose.model('EmotionalRating', DailyPromptAnswers);