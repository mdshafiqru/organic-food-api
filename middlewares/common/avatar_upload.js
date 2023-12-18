const uploader = require("../../utils/single_uploader");

function avatarUpload(req, res, next) {
    const upload = uploader(
        "avatars",
        ["image/jpeg", "image/jpg", "image/png"],
        5000000,
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

module.exports = avatarUpload;