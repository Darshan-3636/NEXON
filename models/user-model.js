const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username:String,
    password:String,
    email:String,
    role:{
        type:String,
        default:"customer"
    },
    contact:Number,
    picture:Buffer,
    cart:[{
        type:mongoose.Schema.Types.ObjectId,
        default:[],
        ref:"product"
    }],
    orders:[{
        type:mongoose.Schema.Types.ObjectId,
        default:[],
        ref:"product"
    }],
})

module.exports = mongoose.model("user",userSchema);