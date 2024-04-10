const mongoose = require('mongoose');

const DailyPromptAnswers = new mongoose.Schema({
    day: Number,
    userId: String,
    username: String,
    answers: Array,
})

<<<<<<< HEAD
module.exports = mongoose.model('DailyPromptAnswers', DailyPromptAnswers);
=======
module.exports = mongoose.model('DailyPromptAnswers', DailyPromptAnswers);
>>>>>>> 0b5c93e34186708b6ca88103c2d2d4b56196e249
