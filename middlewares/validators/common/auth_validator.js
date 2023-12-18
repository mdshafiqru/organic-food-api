const {body} = require('express-validator');

const validationHandler = require('../../common/validation_handler');

const register = [
    body('name')
        .trim()
        .isLength({min: 3})
        .withMessage("Name must be at lest 3 character long."),
    body('phone')
        .trim()
        .isLength({min: 11})
        .withMessage("Provide a valid phone"),
    body('password')
        .trim()
        .isLength({min: 6})
        .withMessage("Password must be at lest 6 character long."),
    validationHandler,
    
];

const login = [
    body('phone')
        .trim()
        .isLength({min: 11})
        .withMessage("Provide a valid phone"),
    body('password')
        .trim()
        .isLength({min: 6})
        .withMessage("Password must be at lest 6 character long."),
    validationHandler,
    
];
const checkResetPass = [
    body('email')
        .trim()
        .isEmail()
        .withMessage("Provide a valid email"),
    validationHandler,
];

// reset password for not logged in users
const resetPass = [
    body('email')
        .trim()
        .isEmail()
        .withMessage("Provide a valid email"),
    
    body('newPass')
        .trim()
        .isLength({min: 6})
        .withMessage("Password must be at lest 6 character long."),
    validationHandler,
];

// update password for logged in users
const updatePass = [
    body('currentPass')
        .trim()
        .isLength({min: 6})
        .withMessage("Password must be at lest 6 character long."),
    body('newPass')
        .trim()
        .isLength({min: 6})
        .withMessage("Password must be at lest 6 character long."),
    validationHandler,
];


const updateProfile = [
    body('name')
        .trim()
        .isLength({min: 3})
        .withMessage("Name must be at lest 3 character long."),
    

    validationHandler,
    
];

const blockUser = [
    body('userId')
        .trim()
        .isLength({min: 1})
        .withMessage("Block reason is required"),

    body('blockedReason')
        .trim()
        .isLength({min: 1})
        .withMessage("Block reason is required"),

    validationHandler,
];


module.exports = {
    register,
    login,
    checkResetPass,
    validationHandler,
    resetPass,
    updatePass,
    updateProfile,
    blockUser,
};