const mongoose = require('mongoose');

const sliderSchema = mongoose.Schema({

    image: {
        type: String,
        required: [true, 'category name is required'],
    },

}, { timestamps: false });

const Slider = new mongoose.model("Slider", sliderSchema);

module.exports = Slider;