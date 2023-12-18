const mongoose = require('mongoose');

const cartSchema = mongoose.Schema({
    
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
    },

    productId: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
    },

    qty: Number,


}, { timestamps: false });

const Cart = new mongoose.model("Cart", cartSchema);

module.exports = Cart;