const express = require('express');
const router  = express.Router();
const isOwner  = require('../middlewares/isOwner');
const upload = require('../config/multer-config');
const productModel =  require('../models/product-model');

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



// create product route

router.get('/createproduct',isOwner , (req, res)=>{
    let error = req.flash('error');
    let success = req.flash('success');
    res.render('admin_dashboard_sidebar/createProduct',{error, success})
})

router.post('/create', isOwner, upload.single('image'), async (req, res)=>{
    try{
        let {name, price, discount, bgcolor, panelcolor, textcolor} = req.body;

         await productModel.create({
            image: req.file.buffer,
            name,
            price,
            discount,
            bgcolor,
            panelcolor,
            textcolor,
            company:req.owner.company
         })

         req.flash('success','product created successfully');
         res.redirect('/owners/createproduct')
    }
    catch(err){
        req.flash('error','Something went Wrong');
        res.redirect('/owners/createproduct')
    }
})






module.exports = router;