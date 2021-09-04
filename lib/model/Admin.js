const mongoose=require('mongoose');

const Schema=mongoose.Schema;

const AdminSchema=new Schema({
    username: String, 
    hash: String,
    salt: String,
})

module.exports=mongoose.model('Admins',AdminSchema,'admins')