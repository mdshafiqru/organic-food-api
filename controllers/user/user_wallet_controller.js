
const bcrypt = require('bcrypt');

const User = require('../../models/user/user');
const Wallet = require('../../models/wallet/wallet');
const Auth = require('../../models/common/auth');
const { lockUserWallet } = require('../common/common_controller');

const login = async (req, res) => {
    let { password} = req.body;

    try {
        const userAuth = await Auth.findOne({ user: req.userId, role: "user"});

        if(!userAuth){
            return res.status(400).json({message:"No user found ", success: false});
        }

        if(userAuth.walletLocked){
            return res.status(400).json({message:"Your wallet account is locked. Contact to our customer support.", success: false});
        }
        
        let passwordValid = bcrypt.compareSync(password, userAuth.password);

        if(passwordValid){

            userAuth.wrongPassCountRemain = 3;
            await userAuth.save();

            const wallet = await Wallet.findOne({user: req.userId});
            const user = await User.findOne({_id: req.userId}).select('kycVerified kycPending').exec();

            if(wallet){

                wallet.createdAt = undefined;
                wallet.updatedAt = undefined;

                return res.status(200).json({wallet, user});

            } else {
                return res.status(400).json({message:"Wallet not found", success: false});
            }

        } else {

            const  {status, message} = await lockUserWallet(userAuth.user, "Password");

            return res.status(status).json({message, success: false});
        }
        
    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}

const getWallet = async (req, res) => {

    try {
        
        const wallet = await Wallet.findOne({user: req.userId});

        if(wallet){

            wallet.createdAt = undefined;
            wallet.updatedAt = undefined;

            return res.status(200).json(wallet);

        } else {
            return res.status(400).json({message:"Wallet not found", success: false});
        }

    
    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}



module.exports = {
    login,
    getWallet,
   
}