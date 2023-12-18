const mongoose = require('mongoose');

const divisionSchema = mongoose.Schema({

    name: {
        type: String,
        required: [true, 'name is required'],
    },

    deliveryCharge: {
        type: Number,
        default: 0,
    },

}, { timestamps: false });

const Division = new mongoose.model("Division", divisionSchema);

module.exports = Division;