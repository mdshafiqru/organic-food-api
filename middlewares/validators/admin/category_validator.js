const {body} = require('express-validator');

const validationHandler = require('../../common/validation_handler');



const createCategory = [
    body('name')
        .trim()
        .isLength({min: 1})
        .withMessage("comment can not be empty."),
    validationHandler,
];

const editCategory = [
    body('name')
        .trim()
        .isLength({min: 1})
        .withMessage("comment can not be empty."),
    body('isActive')
        .trim()
        .isLength({min: 1})
        .withMessage("comment can not be empty."),
    validationHandler,
];

module.exports = {
    createCategory,
    editCategory,
}