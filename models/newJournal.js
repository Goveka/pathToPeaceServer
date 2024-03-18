const mongoose = require('mongoose');

const newJournalSchema = new mongoose.Schema({
    date: String,
    day: Number,
    userId: String,
    dailyAccomplishment: String,
    boundariesToBeEnforced: String,
    topPriorities: String,
    thingsDoneBetter: String,
    struggles: String,
    momentsToRemember: String,
    moodTriggers: String,
});

module.exports = mongoose.model('Journal', newJournalSchema);