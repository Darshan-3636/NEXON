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
            let owner =  await ownerModel.findOne({_id:decoded.id}).select("-password");
            if(owner){
                req.owner = {
                    "_id":owner._id,
                    "ownerid":owner._id,
                    "username":owner.username,
                    "email":owner.email,
                    "role":owner.role,
                    "company":owner.company,
                    "picture":owner.picture,
                    "phone":owner.phone,
                    "events":owner.events,
                    "companyPicture":owner.companyPicture
                }
                next();
            }else {
                let emp = await empModel.findOne({_id:decoded.id}).select("-password");
                req.owner = {
                    "_id":emp._id,
                    "ownerid":emp.ownerid,
                    "username":emp.username,
                    "email":emp.email,
                    "role":emp.role,
                    "company":emp.company,
                    "picture":emp.picture,
                    "phone":emp.phone,
                    "events":emp.events,
                    "companyPicture":emp.companyPicture
                }
                next();
            } 
        }
        catch(err){
            req.flash('error',err.message)
            res.redirect('/login');
        }
    }
}