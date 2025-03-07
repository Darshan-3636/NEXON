const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    image:Buffer,
    name:String,
    price:String,
    discount:{
        type:Number,
        default:0
    },
    bgcolor:{
        type:String,
        default:"black"
    },
    panelcolor:{
        type:String,
        default:"grey"
    },
    textcolor:{
        type:String,
        default:"white"
    },
    company:String
})

module.exports = mongoose.model("product",productSchema)