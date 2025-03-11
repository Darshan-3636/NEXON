const express = require('express');
const router  = express.Router();
const isOwner  = require('../middlewares/isOwner');
const upload = require('../config/multer-config');
const ownerModel = require('../models/owner-model')
const productModel =  require('../models/product-model');
const messageModel = require('../models/message-model')

router.get('/users' , isOwner, (req ,res)=>{
    res.render('admin_dashboard_sidebar/users')
})

router.get('/history',isOwner, (req, res)=>{
    res.render('admin_dashboard_sidebar/history')
})

router.get('/analytics',isOwner ,(req, res)=>{
    res.render('admin_dashboard_sidebar/analytics')
})

router.get('/tickets',isOwner , (req, res)=>{
    res.render('admin_dashboard_sidebar/tickets')
})

router.get('/jobs',isOwner , (req, res)=>{
    res.render('admin_dashboard_sidebar/jobs')
})

router.get('/calendar',isOwner , (req, res)=>{
    res.render('admin_dashboard_sidebar/calendar')
})

router.get('/settings',isOwner , (req, res)=>{
    res.render('admin_dashboard_sidebar/settings')
})

router.get('/new_emp',isOwner , (req, res)=>{
    res.send('page not found 404 ;)')
})

router.get('/messages',isOwner , async (req, res)=>{
    let messages = await messageModel.find().select('-_id');
    let error = req.flash('error');
    let success = req.flash('success');
    res.render('admin_dashboard_sidebar/messages',{error, success, messages})
})



// create product route

router.get('/createproduct',isOwner , (req, res)=>{
    let error = req.flash('error');
    let success = req.flash('success');
    res.render('admin_dashboard_sidebar/createProduct',{error, success})
})

router.post('/create', isOwner, upload.single('image'), async (req, res)=>{
    try{
        let {name, price, discount, bgcolor, panelcolor, textcolor} = req.body;

        let createdProduct = await productModel.create({
            image: req.file.buffer,
            name,
            price,
            discount,
            bgcolor,
            panelcolor,
            textcolor,
            company:req.owner.company,
            ownerid:req.owner._id
         })
         
         let owner = await ownerModel.findOne({email:req.owner.email});
         owner.products.push(`${createdProduct._id}`);
         await owner.save();
         req.flash('success','product created successfully');
         res.redirect('/owners/createproduct')
    }
    catch(err){
        req.flash('error',`${err}`);
        res.redirect('/owners/createproduct')
    }
})






module.exports = router;