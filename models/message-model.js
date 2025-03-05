const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    name:String,
    email:String,
    message:String
})

module.exports = mongoose.model('message',messageSchema);