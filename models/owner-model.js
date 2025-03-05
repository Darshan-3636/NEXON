const mongoose = require ('mongoose');


const ownerSchema =  mongoose.Schema({
    username:String, // sign up details done
    password:String, // register done
    email:String, // register done
    role:{
        type:String,
        default:"owner"
    },
    company:String, // sign up details done
    product:[{
        type:mongoose.Schema.Types.ObjectId,
        default:[],
        ref:"product"
    }],
    picture:Buffer, //sign-up details
    phone:Number //sign-up details done
})

module.exports = mongoose.model('owner',ownerSchema)