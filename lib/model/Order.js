const mongoose=require('mongoose');

const Schema=mongoose.Schema;

const OrderSchema=new Schema({
    userId:String,
    items: Array,
    totals:Number,
    firstName: String,
    lastName:String,
    email: String,
    address:String,
    status:String
})

module.exports=mongoose.model('Orders',OrderSchema,'orders')