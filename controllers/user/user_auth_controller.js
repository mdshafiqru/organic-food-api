
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {unlink} = require('fs');
const axios = require('axios');

const User = require('../../models/user/user');
const path = require('path');
const fs = require('fs');


const login = async (req, res) => {
    let {phone, password} = req.body;
    
    try {
        const user = await User.findOne({phone});
    
        if(!user){
            return res.status(400).json({message:"No user found with this phone number", success: false});
        }

        let passwordValid = bcrypt.compareSync(password, user.password);

        if(passwordValid){

            let token = jwt.sign({userId: user.id}, process.env.JWT_SECRET, {expiresIn : '365d'});
            user.password = undefined;

            return res.status(200).json({user, token});

        } else {
            return res.status(400).json({message : "Wrong Password", success: false});
        }
        
    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}

// const sendSignupOtp = async (req, res) => {
//     let {phone, otpCode, signatureID} = req.body;
    
//     try {
//         const user = await User.findOne({ phone });
    
//         if(user){
//             return res.status(400).json({message:"Account already exists with this phone number, try another.", success: false});
//         }
//         else {

//             let encodedOtpCode = encodeURIComponent(encodeURIComponent(otpCode));
//             let encodedSignature = encodeURIComponent(encodeURIComponent(signatureID));

//             let message =`<#> Your OTP is ${encodedOtpCode} \n${encodedSignature}`;

//             let url = `${process.env.SMS_API}&to=${encodeURIComponent(phone)}&message=${encodeURIComponent(message)}`;

//             await axios.get(url);

//             return res.status(200).json({message:"OTP Sent", success: true});
//         }
//     } catch (error) {
//         return res.status(500).json({message: error.message, success: false});
//     }
// }

// const sendForgetOtp = async (req, res) => {
//     let {phone, countryCode, otpCode, signatureID} = req.body;
    
//     try {
//         const userAuth = await Auth.findOne({ phone, role: "user" });

//         if(userAuth){
//             if(userAuth.walletLocked){
//                 return res.status(400).json({message:"Your wallet account is locked. Contact to our customer support.", success: false});
//             }
            
//             let encodedOtpCode = encodeURIComponent(encodeURIComponent(otpCode));
//             let encodedSignature = encodeURIComponent(encodeURIComponent(signatureID));

//             let message = `<#> Your OTP is ${encodedOtpCode} \n${encodedSignature}`;

//             let url = `${process.env.SMS_API}&to=${encodeURIComponent(phone)}&message=${encodeURIComponent(message)}`;

//             await axios.get(url);
            
//             return res.status(200).json({message:"OTP Sent", success: true});
//         }
//         else {
//             return res.status(400).json({message:"No account found with this phone number", success: false});
            
//         }
//     } catch (error) {
//         return res.status(500).json({message: error.message, success: false});
//     }
// }


const register = async (req, res) => {
    let {name, phone, password} = req.body;

    try {
        const existingUser = await User.findOne({phone});

        if(existingUser){
            return res.status(400).json({message: "Account already exists with this phone number", success: false});
        } else {

            const salt = bcrypt.genSaltSync(10);
            let hashedPass = bcrypt.hashSync(password, salt);
            
            let user = await User.create({name, phone, password: hashedPass});

            let token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn : '365d'});

            user.updatedAt = undefined;
            user.__v = undefined;
            user.password = undefined;

            return res.status(200).json({user, token});

        }

    } catch (error) {
        
        return res.status(500).json({message: error.message, success: false});
    }
}

const user = async (req, res) => {
    
    try {
        const user = await User.findOne({ _id: req.userId });
       
        if(user){

            user.updatedAt = undefined;
            user.__v = undefined;
            user.password = undefined;
            
            return res.status(200).json({user});
        
        }
        else {
            return res.status(401).json({message: "User not found", success: false});
        }

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}



// // reset password for Not Logged in users
// const createNewPass = async (req, res) => {
//     try {
//         const {phone, newPass} = req.body;

//         const userAuth = await Auth.findOne({ phone, role: "user" });

//         if(userAuth){

//             const salt = bcrypt.genSaltSync(10);
//             let hashedPass = bcrypt.hashSync(newPass, salt);

//             const user = await User.findOne({ _id: userAuth.user }).select('phone').exec();

//             userAuth.password = hashedPass;
//             userAuth.wrongPassCountRemain = 3;
//             await userAuth.save();

//             let token = jwt.sign({userId: user.id, role: userAuth.role}, process.env.JWT_SECRET, {expiresIn : '365d'});
            
//             return res.status(200).json({user, token});

//         } else {
//             return  res.status(400).json({message: "Account not found with this phone number", success: false});
//         }
        
//     } catch (error) {
//         return res.status(500).json({message: error.message, success: false});
//     }
// }

// update password for Logged in users

const updatePass = async (req, res) => {
    
    try {
        
        const {currentPass, newPass} = req.body;

        const user = await User.findOne({ _id: req.userId });

        if(user){
            
            let passwordValid = bcrypt.compareSync(currentPass, user.password);

            if(passwordValid){

                const salt = bcrypt.genSaltSync(10);
                let hashedPass = bcrypt.hashSync(newPass, salt);

                user.password = hashedPass;
                await user.save();

                return res.status(200).json({message: 'Password Updated Successfully!', success: true});

            } else {
                return res.status(400).json({message:"Current password not matched.", success: false});
            }
        }
        else {
            return res.status(401).json({message: "User not found", success: false});
        }

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}


// const updateProfile = async (req, res) => {
    
//     try {
        
//         const {name, phone, shortBio} = req.body;

//         const user = await User.findOne({ _id: req.userId });

//         if(user){

//             user.name = name;
//             user.phone = phone;
//             user.shortBio = shortBio;
//             await user.save();


//             return res.status(200).json({message: 'Profile Updated Successfully!', success: true});
//         }
//         else {
//             return res.status(401).json({message: "User not found", success: false});
//         }

//     } catch (error) {
//         return res.status(500).json({message: error.message, success: false});
//     }
// }


// const updateProfilePhoto = async (req, res) => {
//     const uploadedFile = req.files[0];

//     if(!uploadedFile){
//         return res.status(400).json({message: "File not uploaded", success: false});
        
//     }

//     try {
//         const user = await User.findOne({ _id: req.userId });

//         if(user){

//             const existFilePath = `public/${user.avatar}`;

//             if(fs.existsSync(existFilePath)){
//                 unlink(
//                     existFilePath,
//                     (err) =>  {
//                         if(err){
//                             console.log(err.message)
//                         }
//                     }
//                 );
//             }

//             const filePath = `uploads/avatars/${uploadedFile.filename}`;

//             user.avatar = filePath
//             await user.save();

//             return res.status(200).json({message: "Profile Photo Updated", success: true, avatar: filePath});
//         }
//         else {
//             return res.status(401).json({message: "User not found", success: false});
//         }

//     } catch (error) {

//         if(req.files.length > 0){
//             const {filename} = req.files[0];

//             const filePath = `public/uploads/avatars/${filename}`;

//             if(fs.existsSync(filePath)){
//                 unlink(
//                     filePath,
//                     (err) =>  {
//                         if(err){
//                             console.log(err.message)
//                         }
//                     }
//                 );
//             }

//         }
        
//         return res.status(500).json({message: error.message, success: false});
//     }
// }



module.exports = {
    user,
    login,
    // sendSignupOtp,
    // sendForgetOtp,
    register,
    // createNewPass,
    updatePass,
    // updateProfile,
    // updateProfilePhoto,
}