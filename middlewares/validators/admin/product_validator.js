const {body} = require('express-validator');

const validationHandler = require('../../common/validation_handler');



const createProduct = [
    body('name')
        .trim()
        .isLength({min: 1})
        .withMessage("name can not be empty."),
    body('categoryId')
        .trim()
        .isLength({min: 1})
        .withMessage("Category ID is required."),
    body('size')
        .trim()
        .isLength({min: 1})
        .withMessage("size can not be empty."),
    body('price')
        .trim()
        .isLength({min: 1})
        .withMessage("price can not be empty."),
    validationHandler,
];

const editProduct = [
    body('name')
        .trim()
        .isLength({min: 1})
        .withMessage("name can not be empty."),
    body('categoryId')
        .trim()
        .isLength({min: 1})
        .withMessage("Category ID is required."),
    body('size')
        .trim()
        .isLength({min: 1})
        .withMessage("size can not be empty."),
    body('price')
        .trim()
        .isLength({min: 1})
        .withMessage("price can not be empty."),
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
    createProduct,
    editProduct,
    editCategory,
}