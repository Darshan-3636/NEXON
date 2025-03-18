const messageModel = require('../models/message-model');
const ownerModel =  require('../models/owner-model');
const bcrypt = require('bcrypt');
const {generateOwnerToken} = require('../utils/generateOwnerToken');
const empModel = require('../models/emp-model');
const { generateEmpToken } = require('../utils/generateEmpToken');

module.exports.message = async (req, res) => {
    try {
        const { name, email, message, company } = req.body;

        // Validation for required fields
        if (!name || !email || !message || !company) {
            req.flash('error', 'All fields are required.');
            return res.redirect('/contact');
        }

        // Create a new message entry in MongoDB
        await messageModel.create({ name, email, message, company });

        req.flash('success', 'Message sent successfully');
        res.redirect('/contact');
    } catch (err) {
        console.error('Error:', err); // Log the error for debugging
        req.flash('error', 'Something went wrong while sending your message.');
        res.redirect('/contact');
    }
};

//login 

module.exports.login = async (req , res)=>{
    try{
        let {email , password} = req.body;

        let owner = await ownerModel.findOne({email});
        let emp = await empModel.findOne({email})
        if(!owner && !emp){
            req.flash('error','Incorrect Email or Password');
            res.redirect('/login')
        }else{
            if(owner){
                bcrypt.compare(password, owner.password, function(err, result) {
                    if(result){
                        let ownerToken = generateOwnerToken(owner);
                        res.cookie("ownerToken",ownerToken);
                        req.flash('success','Logged in Successfully');
                        res.redirect('/admin_dashboard');
                    }else{
                        req.flash('error','Incorrect Email or Password');
                        res.redirect('/login');
                    }
                });
            }else{
                bcrypt.compare(password, emp.password, function(err, result) {
                    if(result){
                        let ownerToken = generateEmpToken(emp);
                        res.cookie("ownerToken",ownerToken);
                        req.flash('success','Logged in Successfully');
                        res.redirect('/admin_dashboard');
                    }else{
                        req.flash('error','Incorrect Email or Password');
                        res.redirect('/login');
                    }
                });
            }
    }}
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