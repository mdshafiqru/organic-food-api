const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({

    about: String,
    terms: String,
    privacy: String,
    email: String,

}, { timestamps: false });

const AppInfo = new mongoose.model("AppInfo", categorySchema);

module.exports = AppInfo;