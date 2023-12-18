
// internal imports
// middlwares imports
const admin = require('../middlewares/admin/admin');
const avatarUpload = require('../middlewares/common/avatar_upload');

// validator middleware imports
const authValidator = require('../middlewares/validators/common/auth_validator');
const categoryValidator = require('../middlewares/validators/admin/category_validator');
const productValidator = require('../middlewares/validators/admin/product_validator');
const productImageUpload = require('../middlewares/admin/product_image_upload');
const sliderImageUpload = require('../middlewares/admin/slider_image_upload');

// controllers imports
const authController = require('../controllers/admin/auth_controller');
const categoryController = require('../controllers/admin/category_controller');
const productController = require('../controllers/admin/product_controller');
const settingController = require('../controllers/admin/setting_controller');

module.exports = (express) => {
    const router = express.Router();


    router.post('/login', authValidator.login, authController.login);
    // router.post('/register', authValidator.register , authController.register);

    //slider
    router.post('/create-slider', admin, sliderImageUpload, settingController.createSlider);
    router.get('/get-sliders', admin, settingController.allSliders);
    router.delete('/delete-slider/id=:id', admin, settingController.deleteSlider);

    // divisions
    router.post('/create-division', admin, settingController.createDivision);
    router.get('/get-divisions', admin, settingController.getDivisions);
    router.delete('/delete-division/id=:id', admin, settingController.deleteDivision);
    router.put('/edit-division', admin, settingController.editDivision);

    // app info
    router.post('/create-app-info', admin, settingController.createAppInfo);
    router.get('/get-app-info', admin, settingController.getAppInfo);



    //category
    router.post('/create-category', admin, categoryValidator.createCategory , categoryController.createCategory);
    router.get('/get-categories', admin, categoryController.getCategories);
    router.delete('/delete-category/id=:id', admin, categoryController.deleteCategory);

    
    //products
    router.post('/create-product', admin, productImageUpload, productValidator.createProduct , productController.createProduct);
    router.get('/get-products/skip=:skip', admin, productController.allProducts);
    router.post('/edit-product', admin, productImageUpload, productValidator.editProduct, productController.editProduct);
    router.delete('/delete-product/id=:id', admin, productController.deleteProduct);


    return router;
}
