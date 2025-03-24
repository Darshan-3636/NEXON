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
    },
    events: [ 
            {
                _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Add unique ID to each event
                title: String,
                start: {
                    type:Date,
                },
                description: String,
                backgroundColor: { type: String, default: '#007BFF' },
                borderColor: { type: String, default: '#007BFF' }
            }
    ]
})

module.exports = mongoose.model('emp',empSchema)