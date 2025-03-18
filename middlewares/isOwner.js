const jwt = require('jsonwebtoken');
const ownerModel =require('../models/owner-model');
const empModel = require("../models/emp-model");

module.exports = async (req, res , next )=>{
    if(!req.cookies.ownerToken){
        req.flash("error","you need to login first");
        return res.redirect('/login');
    }
    else{
        try{
            let decoded = jwt.verify(req.cookies.ownerToken , process.env.JWT_KEY);
            let owner =  await ownerModel.findOne({email:decoded.email}).select("-password");
            if(owner){
                req.owner = {
                    "ownerid":owner._id,
                    "username":owner.username,
                    "email":owner.email,
                    "role":owner.role,
                    "company":owner.company,
                    "picture":owner.picture,
                    "phone":owner.phone
                }
                next();
            }else {
                let emp = await empModel.findOne({email:decoded.email}).select("-password");
                req.owner = {
                    "ownerid":emp.ownerid,
                    "username":emp.username,
                    "email":emp.email,
                    "role":emp.role,
                    "company":emp.company,
                    "picture":emp.picture,
                    "phone":emp.phone
                }
                next();
            } 
        }
        catch(err){
            req.flash('error',`${err}`);
            res.redirect('/login');
        }
    }
}