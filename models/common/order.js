const mongoose = require('mongoose');

const AppString = require('../../constants/app_strings');

const orderSchema = mongoose.Schema({

    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
    },

    addressId: {
        type: mongoose.Types.ObjectId,
        ref: "Address",
    },

    invoiceId: String,

    receiverName: String,
   
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
    },

    orderAmount: {
        type: Number,
        default: 0
    },

    deliveryCharge: {
        type: Number,
        default: 0
    },

    grandTotal: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: [AppString.accepted, AppString.approved, AppString.completed, AppString.deleted, AppString.pending, AppString.processing, AppString.rejected, AppString.shipped, AppString.cancelled, AppString.delivered],
        default: AppString.pending,
    },

    reason: String,


}, { timestamps: true });

const Order = new mongoose.model("Order", orderSchema);

module.exports = Order;