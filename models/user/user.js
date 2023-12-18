const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String, 
        required: [true, 'name is required'],
        trim: true
    },
    
    phone: {
        type: String,
        required: [true, 'phone is required'],
        trim: true,
    },
    
    email: {
        type: String, 
        trim: true,
        lowercase: true,
    },

    password: {
        type: String,
        required: [true, 'password is required']
    },

    avatar: {
        type: String, 
    },
}, { timestamps: true });

const User = new mongoose.model("User", userSchema);

module.exports = User;