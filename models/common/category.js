const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({

    name: {
        type: String,
        required: [true, 'category name is required'],
    },

}, { timestamps: false });

const Category = new mongoose.model("Category", categorySchema);

module.exports = Category;