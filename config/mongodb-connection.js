const mongoose = require('mongoose');
const config = require('config');
const dbgr =require('debug')('development:mongoose');

mongoose
.connect(`${config.get("MONGO_URI")}`)
.then(function(){
    dbgr("Connected to database")
})
.catch(function(err){
    console.log(err)
})

module.exports = mongoose.connection;