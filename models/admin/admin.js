const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
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
    password: {
        type: String,
        required: [true, 'password is required']
    },
    
    email: {
        type: String, 
        trim: true,
        lowercase: true,
    },

    avatar: {
        type: String, 
    },
    
}, { timestamps: true });

const Admin = new mongoose.model("Admin", adminSchema);

module.exports = Admin;