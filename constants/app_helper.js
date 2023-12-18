const _ = require('lodash');
const Order = require('../models/common/order');

async function generateInvoiceId(data) {

    try {

        const allowedCharacters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
        const invoiceId = _.shuffle(allowedCharacters).join('').substring(0, 4);
    
        const order = await Order.findOne({invoiceId});
    
        if(order){
            generateInvoiceId(data);
        } else {
            data.invoiceId = invoiceId;
            const order = await Order.create(data);
            return order;
        }
        
    } catch (error) {
        return null;
    }
}


module.exports = {
    generateInvoiceId,
}