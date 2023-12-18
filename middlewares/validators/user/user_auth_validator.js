const {body} = require('express-validator');

const validationHandler = require('../../../middlewares/common/validation_handler');

const register = [
    body('name')
        .trim()
        .isLength({min: 3})
        .withMessage("Name must be at lest 3 character long."),
    body('phone')
        .trim()
        .isLength({min: 10})
        .withMessage("Provide a valid phone"),
    body('password')
        .trim()
        .isLength({min: 6})
        .withMessage("Password must be at lest 6 character long."),
    validationHandler,
    
];


const createWalletAgent = [
    body('name')
        .trim()
        .isLength({min: 3})
        .withMessage("Name must be at lest 3 character long."),
    body('phone')
        .trim()
        .isLength({min: 10})
        .withMessage("Provide a valid phone"),
    body('password')
        .trim()
        .isLength({min: 6})
        .withMessage("Password must be at lest 6 character long."),
    body('country')
        .trim()
        .isLength({min: 1})
        .withMessage("Country name is required"),
    body('countryCode')
        .trim()
        .isLength({min: 1})
        .withMessage("Country code is required"),
    body('dateOfBirth')
        .trim()
        .isLength({min: 1})
        .withMessage("Date of birth  is required"),
    body('motherName')
        .trim()
        .isLength({min: 1})
        .withMessage("Mother's Name  is required"),
    body('nidNumber')
        .trim()
        .isLength({min: 1})
        .withMessage("NID Number is required"),
    body('agentTitle')
        .trim()
        .isLength({min: 1})
        .withMessage("Agent Title is required"),
    body('shopAddress')
        .trim()
        .isLength({min: 1})
        .withMessage("Shop Address is required"),
    validationHandler,
    
];

const createWalletMerchant = [
    body('name')
        .trim()
        .isLength({min: 3})
        .withMessage("Name must be at lest 3 character long."),
    body('phone')
        .trim()
        .isLength({min: 10})
        .withMessage("Provide a valid phone"),
    body('password')
        .trim()
        .isLength({min: 6})
        .withMessage("Password must be at lest 6 character long."),
    body('country')
        .trim()
        .isLength({min: 1})
        .withMessage("Country name is required"),
    body('countryCode')
        .trim()
        .isLength({min: 1})
        .withMessage("Country code is required"),
    body('dateOfBirth')
        .trim()
        .isLength({min: 1})
        .withMessage("Date of birth  is required"),
    body('motherName')
        .trim()
        .isLength({min: 1})
        .withMessage("Mother's Name  is required"),
    body('nidNumber')
        .trim()
        .isLength({min: 1})
        .withMessage("NID Number is required"),
    body('merchantTitle')
        .trim()
        .isLength({min: 1})
        .withMessage("Merchant Title is required"),
    body('shopAddress')
        .trim()
        .isLength({min: 1})
        .withMessage("Shop Address is required"),
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

const walletLogin = [
    body('password')
        .trim()
        .isLength({min: 6})
        .withMessage("Password must be at lest 6 character long."),
    validationHandler,
];


const sendOtp = [
    body('otpCode')
        .trim()
        .isLength({min: 5})
        .withMessage("otpCode is required"),
    body('phone')
        .trim()
        .isLength({min: 11})
        .withMessage("Phone is required"),
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
const createNewPass = [
    body('phone')
        .trim()
        .isLength({min: 8})
        .withMessage("Phone is required"),
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

const submitKyc = [
    body('nidNumber')
        .trim()
        .isLength({min: 10})
        .withMessage("NID number is required"),

    body('motherName')
        .trim()
        .isLength({min: 3})
        .withMessage("Mother's Name must be at lest 3 character long."),

    body('dateOfBirth')
        .trim()
        .isLength({min: 3})
        .withMessage("Date of Birth is required"),
    validationHandler,
];


module.exports = {
    register,
    createWalletAgent,
    createWalletMerchant,
    login,
    walletLogin,
    sendOtp,
    checkResetPass,
    validationHandler,
    createNewPass,
    updatePass,
    updateProfile,
    blockUser,
    submitKyc,
};