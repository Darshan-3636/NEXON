const jwt = require('jsonwebtoken');

const generateOwnerToken = (owner) =>{
    return jwt.sign({email:owner.email, role:owner.role,id:owner._id},process.env.JWT_KEY);
}

module.exports.generateOwnerToken = generateOwnerToken;