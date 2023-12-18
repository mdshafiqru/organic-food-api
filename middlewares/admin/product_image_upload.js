const uploader = require("../../utils/single_uploader");

function productImageUpload(req, res, next) {
    const upload = uploader(
        "product_image",
        ["image/jpeg", "image/jpg", "image/png"],
        1000000,
        "only jpg, jpeg or png format is allowed"
    );

    upload.any()(req, res, (err) => {
        if(err){
            res.status(400).json({
                message: err.message,
                success: false, 
            });
        } else {
            next();
        }
    });
    
}

module.exports = productImageUpload;