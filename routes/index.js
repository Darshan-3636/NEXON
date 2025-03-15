const express = require('express');
const router =  express.Router();
const {message,registerOwner,login,logoutOwner} =  require('../controllers/indexController');
const upload = require('../config/multer-config');
const isOwner = require("../middlewares/isOwner");
const ownerModel = require('../models/owner-model');
const productModel = require('../models/product-model');

//default page routes
router.get('/', (req, res)=>{
    res.render('index');
});

router.get('/about', (req, res)=>{
    res.render('indexFiles/about');
});

router.get('/contact', async (req, res)=>{
    let success = req.flash('success');
    let error = req.flash('error');
    let companies = await ownerModel.find().select('company')
    res.render('indexFiles/contact',{error,success,companies});
});

router.post('/contact',message);

router.get('/services', (req, res)=>{
    res.render('indexFiles/services');
});

router.get('/team', (req, res)=>{
    res.render('indexFiles/team');
});


//login

router.get('/login',(req, res)=>{
    let error = req.flash('error')
    let success = req.flash('success')
    res.render('login',{error, success});
})

router.post('/login',login)

//registration

router.get('/register',(req, res)=>{
    let error = req.flash('error')
    let success = req.flash('success')
    res.render('register',{error,success});
})

router.post('/register',registerOwner)

// registration page 2

router.get('/signup_details', (req, res)=>{
    let success = req.flash('success');
    let error = req.flash('error')
    res.render('signup_details',{error, success})
})

router.post('/signup_details', upload.single('profile'), isOwner, async (req, res) => {
    try {
        const { company, phone, username } = req.body;

        // Check if the company name already exists
        const companyExists = await ownerModel.findOne({ company });

        if (companyExists) {
            req.flash('error', 'Company Name Already Taken');
            return res.redirect('/signup_details');
        } 
        
        const userExists = await ownerModel.findOne({ username });

        if (userExists) {
            req.flash('error', 'UserName Already Taken');
            return res.redirect('/signup_details');
        } 
        
        const phoneExists = await ownerModel.findOne({ phone });

        if (phoneExists) {
            req.flash('error', 'Phone Number Already Exists');
            return res.redirect('/signup_details');
        } 

        // Validate that the company name is not empty or invalid
        if (!company || company.trim() === "") {
            req.flash('error', 'Company Name Cannot Be Empty');
            return res.redirect('/signup_details');
        }
        
        if (!username || username.trim() === "") {
            req.flash('error', 'Username Cannot Be Empty');
            return res.redirect('/signup_details');
        }
        
        if (!phone || phone.trim() === "") {
            req.flash('error', 'Phone Number Cannot Be Empty');
            return res.redirect('/signup_details');
        }

        // Update the owner details in the database
        await ownerModel.updateOne(
            { email: req.owner.email },
            { company, phone, username, picture: req.file.buffer },
            { new: true }
        );

        req.flash('success', 'Business created successfully');
        res.redirect('/admin_dashboard');
    } catch (err) {
        console.error('Error:', err); // Log the error for debugging
        req.flash('error', 'Something went wrong');
        res.redirect('/login');
    }
});



//admin_dashboard

router.get('/admin_dashboard',isOwner, async (req, res)=>{
    let success = req.flash('success')
    let error = req.flash('error')
    let owner = await ownerModel.findOne({email:req.owner.email})
    res.render('admin_dashboard',{success, error,owner});
})




//logout

router.get('/logoutPage',(req, res)=>{
    res.render('admin_dashboard_sidebar/logout')
})

router.get('/logout', logoutOwner)


module.exports = router;
