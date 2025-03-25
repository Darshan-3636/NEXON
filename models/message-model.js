const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    name:String,
    email:String,
    message:String,
    ownerid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'owner'
    }
})

module.exports = mongoose.model('message',messageSchema);