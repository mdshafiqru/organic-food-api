const mongoose = require('mongoose');

const Category = require('../../models/common/category');
const Slider = require('../../models/common/slider');
const Product = require('../../models/common/product');
const Cart = require('../../models/user/cart');
const Division = require('../../models/common/division');
const Address = require('../../models/common/address');
const Order = require('../../models/common/order');
const OrderItem = require('../../models/common/orderItem');
const AppHelper = require('../../constants/app_helper');

const getCarts = async (req, res) => {
    
    try {

        const pipeline = [
            {
                $match: {
                  userId: new mongoose.Types.ObjectId(req.userId) , // Convert userId to ObjectId
                },
            },

            {
                $lookup: {
                    from: "products",              
                    localField: "productId",      
                    foreignField: "_id",          
                    as: "product"              
                },
            },
           
            {
                $unwind: '$product'
            },

            {
                $project: {
                    'product._id': 1,
                    'product.name': 1,
                    'product.size': 1,
                    'product.image': 1,
                    'product.price': 1,
                    'qty': 1,
                    '_id': 1,
                }
              }
        ];
        
        const result = await Cart.aggregate(pipeline).exec();

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}

const addToCart = async (req, res) => {
    
    try {

        const productId =  req.params.productId;

        const product = await Product.findOne({_id: productId});

        if(!product){
            return res.status(400).json({message: "Invalid product ID", success: false});
        }

        const existingCart = await Cart.findOne({ userId: req.userId, productId });

        if(existingCart){

            existingCart.qty = existingCart.qty + 1;
            await existingCart.save();
            
            return res.status(200).json({message: "Added to Cart", success: true});

        } else {

            const newCart = await Cart.create({ userId: req.userId , productId, qty: 1 });

            return res.status(200).json({message: "Added to Cart", success: true});
        }

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}

const removeFromCart = async (req, res) => {
    
    try {

        const productId =  req.params.productId;

        const product = await Product.findOne({_id: productId});

        if(!product){
            return res.status(400).json({message: "Invalid product ID", success: false});
        }

        const cart = await Cart.findOne({ userId: req.userId, productId });

        if(cart){

            cart.qty = cart.qty - 1;
            await cart.save();

            if(cart.qty > 0){
                return res.status(200).json({message: "Removed from Cart", success: true});
            }

            else {
                await Cart.deleteOne({_id: cart.id});
                return res.status(200).json({message: "Removed from Cart", success: true });
            }
            
        } else {
            return res.status(200).json({message: "Invalid Product ID", success: false});
        }

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}


const createAddress = async (req, res) => {
    let {divisionId, district, thana, location } = req.body;
    
    try {
        const division = await Division.findOne({_id: divisionId });

        if(!division){
            return res.status(400).json({message:"Division not found", success: false});
        }

        await Address.create({userId: req.userId, divisionId, district, thana, location });

        return res.status(200).json({message:"Address created Successfully", success: true});

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}




const getAddresses = async (req, res) => {
    
    try {

        const pipeline = [
            {
                $match: {
                  userId: new mongoose.Types.ObjectId(req.userId) , // Convert userId to ObjectId
                },
            },

            {
                $lookup: {
                    from: "divisions",              
                    localField: "divisionId",      
                    foreignField: "_id",          
                    as: "division"              
                },
            },

            {
                $unwind: '$division'
            },
           
            {
                $project: {
                    'divisionId': 0,
                    'userId': 0,
                    '__v': 0,
                }
            }
        ];
        
        const result = await Address.aggregate(pipeline).exec();
    
        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}

const deleteAddress = async (req, res) => {
    
    try {

        const id =  req.params.id;

        const address = await Address.findOne({_id: id});

        if(address){

            await Address.deleteOne({_id: id});

            return res.status(200).json({message: "Address Deleted", success: true});

        } else {
            return res.status(400).json({message: "Address not found", success: false});
        }
    
    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}

const createOrder = async (req, res) => {
    let {addressId, phone, receiverName } = req.body;
    
    try {
        const addresses = await Address.aggregate([
                {$match: {_id: new mongoose.Types.ObjectId(addressId)}},
                {$lookup: {from: 'divisions',  localField: 'divisionId', foreignField: '_id',  as: 'division'}},
                {$unwind: "$division"}
            ]).exec();

        if(addresses.length <= 0){
            return res.status(400).json({message:"Address not found", success: false});
        }

        const address = addresses[0];

        const carts = await Cart.aggregate([
            {$match: {userId: new mongoose.Types.ObjectId(req.userId)}},
            {$lookup: {from: 'products',  localField: 'productId', foreignField: '_id',  as: 'product'}},
            {$unwind: "$product"}
        ]).exec();

        if(carts.length <= 0){
            return res.status(400).json({message:"Cart is Empty", success: false});
        }

        const order = await AppHelper.generateInvoiceId({userId: req.userId, addressId, phone, receiverName });

        let deliveryCharge = address.division.deliveryCharge;

        let orderAmount = 0;

        carts.forEach(async cart =>  {

            const qty = cart.qty;
            const price = cart.product.price;
            const total = qty * price;

            orderAmount += total;

            await OrderItem.create({orderId: order._id, productId: cart.product._id, qty, price, total });

        });

        order.orderAmount = orderAmount;
        order.deliveryCharge = deliveryCharge;
        order.grandTotal = orderAmount + deliveryCharge;

        await order.save();

        await Cart.deleteMany({userId: req.userId});
        
        return res.status(200).json({message:"Order Submitted Successfully", success: true});

    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}


const allOrders = async (req, res) => {
  
    try {

      const skip = req.params.skip;
  
      if(skip){
        const skipInt = parseInt(skip, 10);
        
        if (isNaN(skipInt)) {
          return res.status(400).json({message: "skip should be a number", success: false});
        }
        const limit = 10;

        const pipeline = [

            {
                $match: {
                  userId: new mongoose.Types.ObjectId(req.userId) , // Convert userId to ObjectId
                },
            },

            {
                $sort: {createdAt: -1}
            },

            {
                $skip: skipInt ?? 0
            },
    
            // {
            //     $limit: limit 
            // },

            {
                $lookup: {
                    from: "addresses",              
                    localField: "addressId",       
                    foreignField: "_id",          
                    as: "address"              
                }
            },

            {
                $unwind: '$address'
            },

            {
                $lookup: {
                  from: 'divisions', // name of the Division model collection
                  localField: 'address.divisionId',
                  foreignField: '_id',
                  as: 'address.division'
                }
            },

            {
                $unwind: '$address.division'
            },

            {
                $lookup: {
                    from: "orderitems",              
                    localField: "_id",       
                    foreignField: "orderId",          
                    as: "orderItems"              
                }
            },

            {
                $unwind: '$orderItems',
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'orderItems.productId',
                    foreignField: '_id',
                    as: 'orderItems.product',
                },
            },
        
            {
                $unwind: '$orderItems.product',
            },

            {
                $group: {
                    _id: '$_id',
                    user: { $first: '$user' },
                    address: { $first: '$address' },
                    invoiceId: { $first: '$invoiceId' },
                    phone: { $first: '$phone' },
                    receiverName: { $first: '$receiverName' },
                    orderAmount: { $first: '$orderAmount' },
                    deliveryCharge: { $first: '$deliveryCharge' },
                    grandTotal: { $first: '$grandTotal' },
                    status: { $first: '$status' },
                    reason: { $first: '$reason' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                    __v: { $first: '$__v' },
                    orderItems: { $push: '$orderItems' },
                },
            },

        ]
  
        
        const result = await Order.aggregate(pipeline).exec();
  
        return res.status(200).json(result);
  
      } else {
        return res.status(400).json({message: "Unknown query parameter used", success: false});
      }
    
    } catch (error) {
      return res.status(500).json({message: error.message, success: false});
    }

}

module.exports = {
    getCarts,
    addToCart,
    removeFromCart,
    createAddress,
    getAddresses,
    deleteAddress,
    createOrder,
    allOrders,
}