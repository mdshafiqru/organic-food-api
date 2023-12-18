const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');
const axios = require('axios');
const mongoose = require('mongoose');

const User = require('../../models/user/user');
const Wallet = require('../../models/wallet/wallet');
const Auth = require('../../models/common/auth');
const Charge = require('../../models/common/charge');
const { lockUserWallet, checkUserLimit, createUserTransaction, createAdminTransaction } = require('../common/common_controller');
const UserWalletTransaction = require('../../models/user/user_wallet_transaction');
const Admin = require('../../models/admin/admin');
const AdminWallet = require('../../models/admin/admin_wallet');
const Notification = require('../../models/common/notification');
const Commission = require('../../models/common/commission');
const AdminWalletTransaction = require('../../models/admin/admin_wallet_transaction');


const sendDC = async (req, res) => {
    let { phone, amount, pin, latitude, longitude, reference} = req.body;

    try {

        const senderAuth = await Auth.findOne({ user: req.userId });

        let pinValid = bcrypt.compareSync(pin, senderAuth.password);

        if(!pinValid){
            let {message, status} = await lockUserWallet(senderAuth.user, "PIN");
            return res.status(status).json({message, success: false});
        }

        if(senderAuth.walletLocked){
            return res.status(400).json({message:"Your wallet is locked, failed to send.", success: false});
        }

        senderAuth.wrongPassCountRemain = 3;
        await senderAuth.save();

        const receiverAuth = await Auth.findOne({ phone, role: 'user' });

        if(!receiverAuth){
            return res.status(400).json({message:"No account found with this receiver's phone number. ", success: false});
        }

        if(receiverAuth.user == req.userId){
            return res.status(400).json({message:"You can not use your own phone number.", success: false});
        }

        const superAdmin = await Admin.findOne({role: "super_admin"});

        if(!superAdmin){
            return res.status(400).json({message: "Can not process this request now.", success: false});
        }

        const parsedAmount = parseFloat(amount);

        const charge = await Charge.findOne({userRole: 'user', trxType: 'send' });

        const chargeAmount = parseFloat(charge.rate);
        const totalAmount = parsedAmount + chargeAmount;

        let senderWallet = await Wallet.findOne({user: senderAuth.user});

        if(totalAmount > parseFloat(senderWallet.balance)){
            return res.status(400).json({message:"Insufficient Balance.", success: false});
        }

        const limitStatus = await checkUserLimit({ userId: req.userId, trxType: 'send', trxName: 'Send DC', amount});

        if(!limitStatus.hasLimit){
            return res.status(limitStatus.status).json({message: limitStatus.message, success: limitStatus.hasLimit });
        }

        senderWallet = await Wallet.findOne({user: senderAuth.user});

        while (true) {     

            if(!senderWallet.isBusy){
                senderWallet.isBusy = true;
                await senderWallet.save();

                const prevBalance = parseFloat(senderWallet.balance);
                
                const currentBalance = prevBalance - totalAmount;

                senderWallet.balance = currentBalance;
                
                senderWallet.isBusy = false;
                await senderWallet.save();

                break;
            }

            await new Promise((resolve) => setTimeout(resolve, 10));
            
            senderWallet = await Wallet.findOne({user: senderAuth.user});
        }

        // add to user wallet

        let receiverWallet = await Wallet.findOne({user: receiverAuth.user});

        while (true) {     

            if(!receiverWallet.isBusy){
                receiverWallet.isBusy = true;
                await receiverWallet.save();

                const prevBalance = parseFloat(receiverWallet.balance);

                const currentBalance = prevBalance + parsedAmount;

                receiverWallet.balance = currentBalance;

                receiverWallet.isBusy = false;
                await receiverWallet.save();

                break;
            }

            await new Promise((resolve) => setTimeout(resolve, 10));
            
            receiverWallet = await Wallet.findOne({user: receiverAuth.user});
        }

        let trxData = {
            sender: senderAuth.user,
            receiver: receiverAuth.user,
            admin: superAdmin.id,
            number: phone,
            sentFrom: senderAuth.phone,
            entryBy: 'user',
            trxType: 'send',
            trxName: 'Send DC',
            amount: parsedAmount,
            charge: chargeAmount,
            reference,
            senderBalance: parseFloat(senderWallet.balance), 
            receiverBalance: parseFloat(receiverWallet.balance), 
            latitude,
            longitude,
        };

        const transaction = await createUserTransaction(trxData);

        transaction.sender = undefined;
        transaction.receiver = undefined;
        transaction.admin = undefined;
        transaction.trxType = undefined;
        transaction.receiverBalance = undefined;
        transaction.latitude = undefined;
        transaction.longitude = undefined;
        transaction.entryBy = undefined;
        transaction.status = undefined;
        transaction.updatedAt = undefined;
        transaction.__v = undefined;

        res.status(200).json({message: "Send DC Successfull.", success: true, transaction  });

        return await sendAdminCommissionAndNotification();

        async function sendAdminCommissionAndNotification(){

           
            const trxTime = moment(transaction.createdAt).tz('Asia/Dhaka').format('DD/MM/YYYY HH:mm:ss');

            // send message to receiver

            let receiverMessage = `Received DC Amount: ${parsedAmount.toLocaleString('en-IN')} from ${senderAuth.phone} successful, Balance: ${transaction.receiverBalance.toLocaleString('en-IN')} DC, TrxID: ${transaction.trxId}, Ref: ${reference}, at ${trxTime}.`;
            let receiverUrl = `${process.env.SMS_API}&to=${phone}&message=${receiverMessage}`;
            await axios.get(receiverUrl);

            // await sendTrxSMS(userAuth.phone, receiverMessage);

            await Notification.create({ user: receiverAuth.user, receiverMessage });

            // send message to sender
            let senderMessage = `Send DC Amount: ${parsedAmount.toLocaleString('en-IN')} to ${phone} successful, Balance: ${transaction.senderBalance.toLocaleString('en-IN')} DC, TrxID: ${transaction.trxId}, Ref: ${reference}, at ${trxTime}.`;
            let senderUrl = `${process.env.SMS_API}&to=${senderAuth.phone}&message=${senderMessage}`;
            await axios.get(senderUrl);

            //  await sendTrxSMS(agentAuth.phone, senderMessage);

            await Notification.create({ user: senderAuth.user, senderMessage });

            if(chargeAmount > 0){

                let adminWallet = await AdminWallet.findOne({role: "super_admin" , isBusy: false});
    
                while (true) {
    
                    if(adminWallet){
                        if(!adminWallet.isBusy){
                            adminWallet.isBusy = true;
                            await adminWallet.save();
    
                            const prevBalance = parseFloat(adminWallet.balance);
    
                            const currentBalance = prevBalance + chargeAmount;
    
                            adminWallet.balance = currentBalance;
                            adminWallet.isBusy = false;
                            await adminWallet.save();
    
                            break;
                        }
                    }
    
                    await new Promise((resolve) => setTimeout(resolve, 10));
    
                    adminWallet = await AdminWallet.findOne({role: "super_admin" , isBusy: false});
                }

                const adminTrxData = {
                    senderUser: senderAuth.user,
                    receiverAdmin: superAdmin.id,
                    amount: chargeAmount,
                    trxType: 'send_dc_commission',
                    trxName: 'Send DC Commission',
                    latitude,
                    longitude,
                };
    
                await createAdminTransaction(adminTrxData);
            }

            return 'success';
        }
   
        
    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}

const withdrawToAgent = async (req, res) => {
    let { phone, amount, pin, latitude, longitude} = req.body;

    try {

        const senderAuth = await Auth.findOne({ user: req.userId });

        let pinValid = bcrypt.compareSync(pin, senderAuth.password);

        if(!pinValid){
            let {message, status} = await lockUserWallet(senderAuth.user, "PIN");
            return res.status(status).json({message, success: false});
        }

        if(senderAuth.walletLocked){
            return res.status(400).json({message:"Your wallet is locked, failed to withdraw.", success: false});
        }

        senderAuth.wrongPassCountRemain = 3;
        await senderAuth.save();

        const agentAuth = await Auth.findOne({ phone, role: 'dc_wallet_agent' }); 

        if(!agentAuth){
            return res.status(400).json({message:"No Agent found with this phone number. ", success: false});
        }

        if(agentAuth.user == req.userId){
            return res.status(400).json({message:"You can not use your own phone number.", success: false});
        }

        const superAdmin = await Admin.findOne({role: "super_admin"});

        if(!superAdmin){
            return res.status(400).json({message: "Can not process this request now.", success: false});
        }

        const parsedAmount = parseFloat(amount);

        const charge = await Charge.findOne({userRole: 'user', trxType: 'withdraw_to_agent' });
        
        if(!charge){
            return res.status(400).json({message: "Can not process this request now.", success: false});
        }

        const parsedRate = parseFloat(charge.rate);
        let chargeAmount = parseFloat(( parsedAmount * ( parsedRate / 100)).toFixed(2));

        const totalAmount = parsedAmount + chargeAmount;

        let senderWallet = await Wallet.findOne({user: senderAuth.user});

        if(totalAmount > parseFloat(senderWallet.balance)){
            return res.status(400).json({message:"Insufficient Balance.", success: false});
        }

        const limitStatus = await checkUserLimit({ userId: req.userId, trxType: 'withdraw', trxName: 'Withdraw', amount});

        if(!limitStatus.hasLimit){
            return res.status(limitStatus.status).json({message: limitStatus.message, success: limitStatus.hasLimit });
        }

        senderWallet = await Wallet.findOne({user: senderAuth.user});

        while (true) {     

            if(!senderWallet.isBusy){
                senderWallet.isBusy = true;
                await senderWallet.save();

                const prevBalance = parseFloat(senderWallet.balance);
                
                const currentBalance = prevBalance - totalAmount;

                senderWallet.balance = currentBalance;
                
                senderWallet.isBusy = false;
                await senderWallet.save();

                break;
            }

            await new Promise((resolve) => setTimeout(resolve, 10));
            
            senderWallet = await Wallet.findOne({user: senderAuth.user});
        }

        // // add to user wallet

        let agentWallet = await Wallet.findOne({user: agentAuth.user});

        while (true) {     

            if(!agentWallet.isBusy){
                agentWallet.isBusy = true;
                await agentWallet.save();

                const prevBalance = parseFloat(agentWallet.balance);

                const currentBalance = prevBalance + parsedAmount;

                agentWallet.balance = currentBalance;

                agentWallet.isBusy = false;
                await agentWallet.save();

                break;
            }

            await new Promise((resolve) => setTimeout(resolve, 10));
            
            agentWallet = await Wallet.findOne({user: agentAuth.user});
        }

        let trxData = {
            sender: senderAuth.user,
            receiver: agentAuth.user,
            admin: superAdmin.id,
            number: phone,
            sentFrom: senderAuth.phone,
            entryBy: 'user',
            trxType: 'withdraw',
            trxName: 'Withdraw',
            amount: parsedAmount,
            charge: chargeAmount,
            senderBalance: parseFloat(senderWallet.balance),  
            receiverBalance: parseFloat(agentWallet.balance), 
            latitude,
            longitude,
        };

        const transaction = await createUserTransaction(trxData);

        res.status(200).json({message: "Withdraw Successfull.", success: true, transaction  });

        return await sendCommissionAndNotification();

        async function sendCommissionAndNotification(){


            if(chargeAmount > 0){

                const commission = await Commission.findOne({userRole: 'dc_wallet_agent', trxType: 'withdraw' });

                if(commission){
                    const parsedRate = parseFloat(commission.rate);

                    let agentCommission = parseFloat(( parsedAmount * ( parsedRate / 100)).toFixed(2));

                    let adminCommission = chargeAmount - agentCommission;

                    if(agentCommission > 0){

                        agentWallet = await Wallet.findOne({user: agentAuth.user});
        
                        while (true) {
            
                            if(!agentWallet.isBusy){
                                agentWallet.isBusy = true;
                                await agentWallet.save();
            
                                const prevBalance = parseFloat(agentWallet.balance);
            
                                const currentBalance = prevBalance + agentCommission;
            
                                agentWallet.balance = currentBalance;
                                agentWallet.isBusy = false;
                                await agentWallet.save();
            
                                break;
                            }
            
                            await new Promise((resolve) => setTimeout(resolve, 10));
                            
                            agentWallet = await Wallet.findOne({user: agentAuth.user});
                        }

                        transaction.receiverBalance = parseFloat(agentWallet.balance);
                        await transaction.save();

                        let agentTrxData = {
                            receiver: agentAuth.user,
                            sentFrom: superAdmin.phone,
                            entryBy: 'admin',
                            trxType: 'withdraw_commission',
                            trxName: 'Withdraw Commission',
                            amount: agentCommission,
                        };
                
                        await createUserTransaction(agentTrxData);
                    }

                    if(adminCommission > 0){
                        let adminWallet = await AdminWallet.findOne({role: "super_admin" , isBusy: false});
        
                        while (true) {
            
                            if(adminWallet){
                                if(!adminWallet.isBusy){
                                    adminWallet.isBusy = true;
                                    await adminWallet.save();
            
                                    const prevBalance = parseFloat(adminWallet.balance);
            
                                    const currentBalance = prevBalance + adminCommission;
            
                                    adminWallet.balance = currentBalance;
                                    adminWallet.isBusy = false;
                                    await adminWallet.save();
            
                                    break;
                                }
                            }
            
                            await new Promise((resolve) => setTimeout(resolve, 10));
            
                            adminWallet = await AdminWallet.findOne({role: "super_admin" , isBusy: false});
                        }

                        const adminTrxData = {
                            senderUser: senderAuth.user,
                            receiverAdmin: superAdmin.id,
                            amount: adminCommission,
                            trxType: 'withdraw_commission',
                            trxName: 'Withdraw Commission',
                            latitude,
                            longitude,
                        };
            
                        await createAdminTransaction(adminTrxData);
                    } 
                }

                
            }

           
            const trxTime = moment(transaction.createdAt).tz('Asia/Dhaka').format('DD/MM/YYYY HH:mm:ss');

            // send message to sender
            let senderMessage = `Withdraw DC Amount: ${parsedAmount.toLocaleString('en-IN')} to ${phone} successful, Balance: ${transaction.senderBalance.toLocaleString('en-IN')} DC, TrxID: ${transaction.trxId}, at ${trxTime}.`;
            let senderUrl = `${process.env.SMS_API}&to=${senderAuth.phone}&message=${senderMessage}`;
            await axios.get(senderUrl);

            //  await sendTrxSMS(agentAuth.phone, senderMessage);

            await Notification.create({ user: senderAuth.user, senderMessage });


            // send message to agent

            let agentMessage = `Received Withdraw DC Amount: ${parsedAmount.toLocaleString('en-IN')} from ${senderAuth.phone} successful, Balance: ${transaction.receiverBalance.toLocaleString('en-IN')} DC, TrxID: ${transaction.trxId}, at ${trxTime}.`;
            let agentUrl = `${process.env.SMS_API}&to=${phone}&message=${agentMessage}`;
            await axios.get(agentUrl);

            // await sendTrxSMS(userAuth.phone, agentMessage);

            await Notification.create({ user: agentAuth.user, agentMessage });


            return 'success';
        }
   
        
    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}



const withdrawToMfs = async (req, res)=> {

    try {
        const {pin, number, amount, tag_name, mfs_name, opt_id, prefix, type_id, latitude, longitude, } = req.body;
   
        const userAuth = await Auth.findOne({user: req.userId});

        let pinValid = bcrypt.compareSync(pin, userAuth.password);

        if(!pinValid){
            let {message, status} = await lockUserWallet(userAuth.user, "PIN");
            return res.status(status).json({message, success: false});
        }

        userAuth.wrongPassCountRemain = 3;
        await userAuth.save();

        const superAdmin = await Admin.findOne({role: "super_admin"});

        if(!superAdmin){
            return res.status(400).json({message: "Can not process this request now.", success: false});
        }

        let wallet = await Wallet.findOne({user: userAuth.user});

        if(!wallet){
            return res.status(400).json({message: "wallet not found", success: false});
        } 

        const parsedAmount = parseFloat(amount);

        const charge = await Charge.findOne({userRole: 'user', trxType: 'withdraw_to_mfs' });

        if(!charge){
            return res.status(400).json({message: "Can not process this request now.", success: false});
        }

        const parsedRate = parseFloat(charge.rate);
        let chargeAmount = parseFloat(( parsedAmount * ( parsedRate / 100)).toFixed(2));

        const totalAmount = parsedAmount + chargeAmount;

        if(totalAmount > parseFloat(wallet.balance)){
            return res.status(400).json({message: "Insufficient Balance", success: false});
        }

        res.status(200).json({message: "Withdraw Reqeust submitted successfully, wait for confirmation", success: true});

        return await handleWithdrawMfs();

        async function handleWithdrawMfs(){

           let wallet = await Wallet.findOne({user: userAuth.user});

            while (true) {

                if(!wallet.isBusy){
                    wallet.isBusy = true;
                    await wallet.save();

                    const prevBalance = parseFloat(wallet.balance);

                    const currentBalance = prevBalance - totalAmount;

                    wallet.balance = currentBalance;
                    wallet.isBusy = false;
                    await wallet.save();

                    break;
                }

                await new Promise((resolve) => setTimeout(resolve, 10));
                
                wallet = await Wallet.findOne({user: userAuth.user});
            }

            // update admin wallet

            
            let adminWallet = await AdminWallet.findOne({role: "super_admin", isBusy: false});

            while (true) {

                if(adminWallet){
                    if(!adminWallet.isBusy){
                        adminWallet.isBusy = true;
                        await adminWallet.save();

                        const prevBalance = parseFloat(adminWallet.balance);

                        const currentBalance = prevBalance + totalAmount;

                        adminWallet.balance = currentBalance;
                        adminWallet.isBusy = false;
                        await adminWallet.save();

                        break;
                    }
                }

                await new Promise((resolve) => setTimeout(resolve, 10));

                adminWallet = await AdminWallet.findOne({role: "super_admin", isBusy: false});
            }

            let trxData = {
                sender: userAuth.user,
                admin: superAdmin.id,
                number,
                sentFrom: userAuth.phone,
                entryBy: 'user',
                trxType : "withdraw",
                trxName: "Withdraw",
                amount: parsedAmount,
                charge: chargeAmount,
                senderBalance: wallet.balance,
                reference: `Withdraw receive to ${mfs_name}`,
                latitude,
                longitude,
            };

            const transaction = await createUserTransaction(trxData);

            const adminTrxData = {
                senderUser: userAuth.user,
                receiverAdmin: superAdmin.id,
                amount: chargeAmount,
                trxType: 'withdraw_commission',
                trxName: 'Withdraw Commission',
                latitude,
                longitude,
            };

           const adminTransaction = await createAdminTransaction(adminTrxData);

            let postData = {
                "gateway_api" : process.env.RECHARGE_GATEWAY_API,
                "auth_id" : process.env.AUTH_ID,
                "method" : "execute_request",
                "tag_name" : tag_name,
                "opt_id" : opt_id,
                "number": number,
                "prefix" : prefix,
                "type_id" : type_id,
                "amount" : amount,
                "uniq_id" : transaction.trxId,
                "api_string" : process.env.RECHARGE_MFS_API_STRING,
                "api_pass" : process.env.RECHARGE_API_PASSWORD,
            };

            const response = await axios.post(process.env.RECHARGE_API, postData);
            let status = response.data["status"];

            if(status == 'Success'){

                await new Promise((resolve) => setTimeout(resolve, 5000));

                await checkStatus();

                async function checkStatus(){

                    let statusData = {
                        "gateway_api" : process.env.RECHARGE_GATEWAY_API,
                        "auth_id" : process.env.AUTH_ID,
                        "method" : "get_status",
                        "uniq_id" : transaction.trxId,
                        "api_string" : process.env.RECHARGE_MFS_API_STRING,
                        "api_pass" : process.env.RECHARGE_API_PASSWORD,
                    };
    
                    const response = await axios.post(process.env.RECHARGE_API, statusData);

                    let statusId = parseInt(response.data["status_id"]);

                    // status ids // 1 Pending // 2 Processing // 3 Failed // 4 Canceled // 5 Completed // 6 Waiting
    
                    if(statusId == 1 || statusId == 2 || statusId == 6){

                        await new Promise((resolve) => setTimeout(resolve, 5000));
                        await checkStatus();

                    } else if(statusId == 3) {
                       await sendErrorSMS(`Transaction failed, ${response.data['reason']}, your wallet balance is adjusted.`);
                    }
                    else if(statusId == 4){
                        await sendErrorSMS(`Transaction Cancelled,${response.data['reason']}, your wallet balance is adjusted.`);
                    }
                    else if(statusId == 5){

                        let mfsSender = response.data['sender'] ?? "";
                        let mfsTrxId = response.data['tan_id'] ?? "";
                       
                        transaction.mfsSentFrom = mfsSender;
                        transaction.mfsTrxId = mfsTrxId;
                        transaction.status = 'completed';
                        await transaction.save();
                        
                        let msg = `Withdraw DC amount ${parsedAmount.toLocaleString('en-IN')} to ${tag_name} number ${number} is completed. sender: ${mfsSender}, TrxId: ${mfsTrxId.toUpperCase()}`;
                        let url = `${process.env.SMS_API}&to=${userAuth.phone}&message=${msg}`;
                        
                        return await axios.get(url);
                    }
                } 

            } else if(status == 'Error') {
                let reason = response.data["reason"] != null ? response.data["reason"].toLowerCase() : "" ;

                if(reason.includes("invalid amount") || reason.includes("invalid recharge amount") ) {
                  
                    await sendErrorSMS("Amount is less than minimum cash in amount or invalid amount applied. ");

                } else if(reason.includes("same number wait")) {

                    await sendErrorSMS(`Wait 5 minutes before try with this ${number} same number.`);
                }
                else {
                    await sendErrorSMS("MFS Service is temporaily unavailable now. Try again after some time");
                }
            }

            async function sendErrorSMS(msg){
                
                let wallet = await Wallet.findOne({user: userAuth.user});

                while (true) {

                    if(!wallet.isBusy){
                        wallet.isBusy = true;
                        await wallet.save();

                        const prevBalance = parseFloat(wallet.balance);

                        const currentBalance = prevBalance + totalAmount;

                        wallet.balance = currentBalance;
                        wallet.isBusy = false;
                        await wallet.save();

                        break;
                    }

                    await new Promise((resolve) => setTimeout(resolve, 10));
                    
                    wallet = await Wallet.findOne({user: userAuth.user});
                }

                // update admin wallet

                let adminWallet = await AdminWallet.findOne({role: "super_admin" , balance: { $gte: totalAmount }, isBusy: false});

                while (true) {

                    if(adminWallet){
                        if(!adminWallet.isBusy){
                            adminWallet.isBusy = true;
                            await adminWallet.save();

                            const prevBalance = parseFloat(adminWallet.balance);

                            const currentBalance = prevBalance - totalAmount;

                            adminWallet.balance = currentBalance;
                            adminWallet.isBusy = false;
                            await adminWallet.save();

                            break;
                        }
                    }

                    await new Promise((resolve) => setTimeout(resolve, 10));

                    adminWallet = await AdminWallet.findOne({role: "super_admin" , balance: { $gte: totalAmount }, isBusy: false});
                }

                let url = `${process.env.SMS_API}&to=${userAuth.phone}&message=${msg}`;
                await axios.get(url);

                if(adminTransaction != null){
                    await AdminWalletTransaction.deleteOne({_id: adminTransaction._id});
                }

                await UserWalletTransaction.deleteOne({_id: transaction._id});
                
            }

            return 'success';
        }

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}


module.exports = {
    sendDC,
    withdrawToAgent,
    withdrawToMfs,
}