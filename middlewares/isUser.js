const jwt =  require('jsonwebtoken');
const userModel = require('../models/user-model');

module.exports =  async (req, res , next)=>{
    if(!req.cookies.userToken){
        req.flash("error","you need to login first");
        return res.redirect('/');
    } else {
        try{
            let decoded = jwt.verify(req.cookies.userToken,process.env.JWT_KEY);
            let user = await userModel.findOne({email:decoded.email}).select("-password")
            req.user = user;
            next();
        }
        catch(err){
            req.flash('error',"something went wrong");
            res.redirect('/');
        }
    }
}