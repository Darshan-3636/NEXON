const jwt = require('jsonwebtoken');

const generateEmpToken = (emp) =>{
    return jwt.sign({email:emp.email, role:emp.role,id:emp._id},process.env.JWT_KEY);
}

module.exports.generateEmpToken = generateEmpToken;