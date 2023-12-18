const jwt = require('jsonwebtoken');
const Admin = require('../../models/admin/admin');

const admin = async (req, res, next) => {
    const {authorization} = req.headers;

    try {

        console.log(req.body);
        
        const token = authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const {adminId} = decoded;
       
        const admin = await Admin.findOne({_id: adminId });
        if(admin){
            req.adminId = adminId;
            next();
        } else {
            next({statusCode : 401, message: "Authentication Failed"});
        } 
        
    } catch (error) {

        next({statusCode : 401, message: "Authentication Failed"});
    }
}

module.exports = admin;