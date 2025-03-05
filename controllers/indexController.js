const messageModel = require('../models/message-model');
const ownerModel =  require('../models/owner-model');
const bcrypt = require('bcrypt');
const {generateOwnerToken} = require('../utils/generateOwnerToken')


module.exports.message = async(req , res)=>{
    try{
        let {name , email , message} = req.body;
        await messageModel.create({
            name ,
            email,
            message
        })
        req.flash('success',"message sent successfully");
        res.redirect('/contact');
    }
    catch (err){
        req.flash('error',"something went wrong")
    }
}

//login 

module.exports.login = async (req , res)=>{
    try{
        let {email , password} = req.body;

        let owner = await ownerModel.findOne({email});
        if(!owner){
            req.flash('error','Incorrect Email or Password');
            res.redirect('/register')
        }else{
            bcrypt.compare(password, owner.password, function(err, result) {
                if(result){
                    let ownerToken = generateOwnerToken(owner);
                    res.cookie("ownerToken",ownerToken);
                    req.flash('success','Logged in Successfully');
                    res.redirect('/admin_dashboard');
                }else{
                    req.flash('error',`${result}`);
                    res.redirect('/login');
                }
            });
        }
    }
    catch{
        req.flash('error',"Something went wrong")
        res.render('/')
    }
}

//registeration 

module.exports.registerOwner = async(req, res)=>{
    try{
        let {email , password} = req.body;
        
        let owner = await ownerModel.findOne({email});
        if(owner){
            req.flash('error','You have already registered, please login');
            res.redirect('/login');
        }

        else{
            bcrypt.genSalt(10,(err,salt)=>{
                bcrypt.hash(password, salt, async (err,hash)=>{
                    if(err){
                        req.flash('error',`${err}`);
                        res.redirect('/register');
                    }else{
                        let owner =  await ownerModel.create({
                            email,
                            password:hash
                        })
                        let ownerToken = generateOwnerToken(owner);
                        res.cookie("ownerToken",ownerToken);
                        req.flash('success','email registered');
                        res.redirect('/signup_details');
                    }
                })
            })
        }

    }
    catch(err){
        req.flash("error",`${err}`);
        res.redirect('/');
    }
}

//logout

module.exports.logoutOwner = async(req, res)=>{
    res.cookie("ownerToken","");
    req.flash('success','You have been logged Out');
    res.redirect('/login');
}