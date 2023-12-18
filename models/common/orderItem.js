const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema({

    orderId: {
        type: mongoose.Types.ObjectId,
        ref: "Order",
    },

    productId: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
    },

    qty: Number,
    price: Number,
    total: Number,

}, { timestamps: false });

const OrderItem = new mongoose.model("OrderItem", orderItemSchema);

module.exports = OrderItem;