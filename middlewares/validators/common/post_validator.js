const {body} = require('express-validator');

const validationHandler = require('../../common/validation_handler');
const postValidatorHandler = require('../../../middlewares/common/post_validation_handler');


const createPost = [
    body('title')
        .trim()
        .isLength({min: 3})
        .withMessage("title must be at lest 3 character long."),
    
    body('description')
        .trim()
        .isLength({min: 3})
        .withMessage("description must be at lest 3 character long."),

    body('categoryId')
        .trim()
        .isLength({min: 1})
        .withMessage("postId is required."),
    postValidatorHandler,
    
];

const editPost = [
    body('title')
        .trim()
        .isLength({min: 3})
        .withMessage("title must be at lest 3 character long."),
    
    body('description')
        .trim()
        .isLength({min: 3})
        .withMessage("description must be at lest 3 character long."),

    body('categoryId')
        .trim()
        .isLength({min: 1})
        .withMessage("categoryId is required."),

    body('postId')
        .trim()
        .isLength({min: 1})
        .withMessage("postId is required."),
    
    validationHandler,
];

const searchPost = [
    body('query')
        .trim()
        .isLength({min: 1})
        .withMessage("comment can not be empty."),
    
    validationHandler,
];

module.exports = {
    createPost,
    editPost,
    searchPost,
}