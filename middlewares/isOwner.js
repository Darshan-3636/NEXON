const jwt = require('jsonwebtoken');
const ownerModel =require('../models/owner-model');

module.exports = async (req, res , next )=>{
    if(!req.cookies.ownerToken){
        req.flash("error","you need to login first");
        return res.redirect('/login');
    }
    else{
        try{
            let decoded = jwt.verify(req.cookies.ownerToken , process.env.JWT_KEY);
            let owner =  await ownerModel.findOne({email:decoded.email}).select("-password");
            req.owner= owner;
            next();
        }
        catch(err){
            req.flash('error',`${err}`);
            res.redirect('/login');
        }
    }
}