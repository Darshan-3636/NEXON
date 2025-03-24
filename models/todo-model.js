const mongoose = require('mongoose');

const todoSchema = mongoose.Schema({
    _id:String,
    todo:[{
        title:String,
        Status:{
            type:String,
            default:"pending"
        },
        date:{
            type:Date,
            default:Date.now
        }
    }]
})

module.exports = mongoose.model('todo',todoSchema);