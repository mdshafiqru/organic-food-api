
// internal imports-
// middleware imports
const user = require('../middlewares/user/user');
// const avatarUpload = require('../middlewares/common/avatar_upload');

// validators middlware inports
const userAuthValidator = require('../middlewares/validators/user/user_auth_validator');

//controllers inports
const userAppController = require('../controllers/user/user_app_controller');
const userAuthController = require('../controllers/user/user_auth_controller');
const orderController = require('../controllers/user/order_controller');


module.exports = (express) => {
    const router = express.Router();

    // auth
    router.post('/login', userAuthValidator.login, userAuthController.login);
    // router.post('/send-signup-otp', userAuthValidator.sendOtp, userAuthController.sendSignupOtp);
    router.post('/register', userAuthValidator.register, userAuthController.register);
    // router.post('/send-forget-otp', userAuthValidator.sendOtp, commonController.sendUserForgetOtp);
    // router.post('/send-forget-otp', userAuthValidator.sendOtp, userAuthController.sendForgetOtp);
    // router.put('/create-new-pass', userAuthValidator.createNewPass, userAuthController.createNewPass);

    // router.post('/update-device-id', user, commonController.updateUserDeviceId);
    // router.post('/send-fcm-notification', user, commonController.sendFcmNotification);

    router.get('/', user, userAuthController.user);
    router.put('/update-pass', user, userAuthValidator.updatePass, userAuthController.updatePass);
    // router.put('/update-profile', user, userAuthValidator.updateProfile, userAuthController.updateProfile);
    // router.post('/update-profile-photo', user, avatarUpload, userAuthController.updateProfilePhoto);


    // dashboard
    router.get('/get-app-info', userAppController.getAppInfo);
    router.get('/get-sliders', userAppController.getSliders);
    router.get('/get-categories', userAppController.getCategories);
    router.get('/all-products/skip=:skip', userAppController.allProducts);
    router.get('/products-by-category/categoryId=:categoryId/skip=:skip', userAppController.productsByCategory);
    router.get('/search-products/query=:query', userAppController.searchProducts);

    router.get('/get-divisions', userAppController.getDivisions);


    // cart 

    router.get('/get-carts', user, orderController.getCarts);
    router.get('/add-to-cart/productId=:productId', user, orderController.addToCart);
    router.delete('/remove-from-cart/productId=:productId', user, orderController.removeFromCart);
    
    // address
    router.post('/create-address', user, orderController.createAddress);
    router.get('/get-addresses', user, orderController.getAddresses);
    router.delete('/delete-address/id=:id', user, orderController.deleteAddress);

    // orders
    router.post('/create-order', user, orderController.createOrder);
    router.get('/all-orders/skip=:skip', user, orderController.allOrders);
   
    return router;
}




