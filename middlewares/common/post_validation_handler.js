const {validationResult} = require('express-validator');
const {unlink} = require('fs');

const postValidationHandler = (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {

        req.files.forEach(file => {

            const filePath = `public/uploads/post_images/${file.filename}`;
            
            if(fs.existsSync(filePath)){
                unlink(
                    filePath,
                    (err) =>  {
                        if(err){
                            console.log(err.message)
                        }
                    }
                );
            }
        
        });

      return res.status(400).json({ errors: errors.array() });
    }
    next();
}

module.exports = postValidationHandler;