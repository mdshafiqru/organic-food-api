
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Admin = require('../../models/admin/admin');



const login = async (req, res) => {
    let {phone, password} = req.body;
    
    try {
        const admin = await Admin.findOne({ phone });
    
        if(!admin){
            return res.status(400).json({message:"No admin found with this phone number", success: false});
        }

        let passwordValid = bcrypt.compareSync(password, admin.password);

        if(passwordValid){

            let token = jwt.sign({adminId: admin._id }, process.env.JWT_SECRET, {expiresIn : '365d'});

            admin.password = undefined;
            return res.status(200).json({admin, token});

        } else {
            return res.status(400).json({message:"Wrong Password", success: false});
        }

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}


const register = async (req, res) => {
    let {name, phone, password} = req.body;

    try {
        const existingAdmin = await Admin.findOne({phone});

        if(existingAdmin){
            return res.status(400).json({message: "Account already exists with this phone number", success: false});
        } else {

            const salt = bcrypt.genSaltSync(10);
            let hashedPass = bcrypt.hashSync(password, salt);
            
            let admin = await Admin.create({name, phone, password: hashedPass});

            let token = jwt.sign({adminId: admin._id}, process.env.JWT_SECRET, {expiresIn : '365d'});

            admin.updatedAt = undefined;
            admin.__v = undefined;
            admin.password = undefined;

            return res.status(200).json({admin, token});

        }

    } catch (error) {
        
        return res.status(500).json({message: error.message, success: false});
    }
}


module.exports = {
    register,
    login,
}