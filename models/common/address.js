const mongoose = require('mongoose');

const addressSchema = mongoose.Schema({

    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
    },

    divisionId: {
        type: mongoose.Types.ObjectId,
        ref: "Division",
    },

    district: {
        type: String,
        required: [true, 'district name is required'],
    },

    thana: {
        type: String,
        required: [true, 'Thana name is required'],
    },

    location: {
        type: String,
        required: [true, 'home address is required'],
    },

}, { timestamps: false });

const Address = new mongoose.model("Address", addressSchema);

module.exports = Address;