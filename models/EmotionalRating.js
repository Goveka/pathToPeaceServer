const mongoose = require('mongoose');

const EmotionalRatingSchema = new mongoose.Schema({
    date: String,
    day: Number,
    userId: String,
    fatigueAndExhaustion: Number,
    anxiety: Number,
    emotionalNumbness: Number,
    isolation: Number,
    insecurity: Number,
    AverageEmotion: Number,
})

module.exports = mongoose.model('EmotionalRating', EmotionalRatingSchema);