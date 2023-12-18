const jwt = require('jsonwebtoken');
const User = require('../../models/user/user');
// const Auth = require('../../models/common/auth');

const user = async (req, res, next) => {
    const {authorization} = req.headers;

    try {
        
        const token = authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const {userId} = decoded;

        const user = await User.findOne({_id: userId });

        if(user){
            req.userId = userId;
            next();
        }
        else {
            next({statusCode : 401, message: "Authentication Failed"});
        }
            
    } catch (error) {
        next({statusCode : 401, message: "Authentication Failed"});
    }
}

module.exports = user;