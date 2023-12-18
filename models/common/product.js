const mongoose = require('mongoose');

const productSchema = mongoose.Schema({

    name: {
        type: String,
        required: [true, 'Name is required'],
    },

    categoryId: {
        type: mongoose.Types.ObjectId,
        ref: "Category",
    },

    size: {
        type: String,
        required: [true, 'Size is required'],
    },

    image: {
        type: String,
    },

    shortDesc: {
        type: String,
    },
    
    longDesc: {
        type: String,
    },
    
    price: {
        type: Number,
        required: [true, 'Price is required'],
    },

}, { timestamps: false });

const Product = new mongoose.model("Product", productSchema);

module.exports = Product;