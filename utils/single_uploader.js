const createError = require('http-errors')
const multer = require("multer");
const path = require("path");
const uuid = require('uuid');


function uploader(
    subfolder_path,
    allowed_file_types,
    max_file_size,
    error_msg
){
    
    // make upload object
    const UPLOADS_FOLDER = `public/uploads/${subfolder_path}/`;

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, UPLOADS_FOLDER);
        },
        filename: (req, file, cb) => {
            
            const fileName = uuid.v1() + '-' + Date.now() + '.jpg' + path.extname(file.originalname);

            
            cb(null, fileName );
        }
    });
    

    const upload = multer({
        storage: storage,
        limits: {
            fileSize: max_file_size,
        },
        fileFilter: (req, file, cb) => {
           
            if(allowed_file_types.includes(file.mimetype)){
                cb(null, true);
            } else {
                cb(createError(error_msg));
            }
        }
    });

    return upload;

}

module.exports = uploader;