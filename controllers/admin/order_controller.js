const mongoose = require('mongoose');


const Cart = require('../../models/user/cart');
const Address = require('../../models/common/address');
const Order = require('../../models/common/order');
const OrderItem = require('../../models/common/orderItem');
const AppHelper = require('../../constants/app_helper');


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
                $sort: {createdAt: -1}
            },

            {
                $skip: skipInt ?? 0
            },
    
            // {
            // $limit: limit 
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
                    userId: { $first: '$userId' },
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

const updateOrderStatus = async (req, res) => {
    let {id, status, reason } = req.body;

    try {

        const order = await Order.findOne({_id: id});

        if(!order){
            return res.status(400).json({message: "Order not found", success: false});
        }

        order.status = status;
        order.reason = reason;

        await order.save();

        return res.status(200).json({message: "Updated Order Status", success: true});
        
    } catch (error) {
        return res.status(500).json({message: error.message, success: false});
    }
}

module.exports = {
    updateOrderStatus,
    allOrders,
}