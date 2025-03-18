const mongoose = require ('mongoose');


const empSchema =  mongoose.Schema({
    username:String, 
    password:String, 
    email:String, 
    role:{  
        type:String,
        default:"emp"
    },
    company:String, 
    picture:Buffer,  
    phone:String, 
    ownerid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"owner"
    } 
})

module.exports = mongoose.model('emp',empSchema)