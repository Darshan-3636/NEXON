const express = require('express');
const router  = express.Router();
const isOwner  = require('../middlewares/isOwner');
const upload = require('../config/multer-config');
const ownerModel = require('../models/owner-model')
const productModel =  require('../models/product-model');
const messageModel = require('../models/message-model')
const orderModel = require('../models/order-model');
const userModel  = require('../models/user-model');

router.get('/users' , isOwner, (req ,res)=>{
    res.render('admin_dashboard_sidebar/users')
})

router.get('/history',isOwner, (req, res)=>{
    res.render('admin_dashboard_sidebar/history')
})

router.get('/analytics',isOwner , async (req, res)=>{
    
    const Raworders = await orderModel.find().populate('productid'); // Assuming productid is linked to a product model
    
    const orders = Raworders.filter(order => 
        order.productid && order.productid.ownerid.toString() === req.owner.ownerid.toString()
    );
    const processedOrders = orders.map(order => ({
        userid: order.userid,
        productid: order.productid,
        quantity: order.quantity,
        date: order.date,
        orderStatus: order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1), // Capitalize order status
        totalAmount: order.productid.price * order.quantity  // Assuming `productid.price` exists
    }));

    const totalCustomers = [...new Set(orders.map(order => order.userid.toString()))].length;

    res.render('admin_dashboard_sidebar/analytics',{ orders: processedOrders, totalCustomers})
})

router.get('/tickets',isOwner , async (req, res)=>{
    const Raworders = await orderModel.find().populate('productid').populate('userid');
    
    const orders = Raworders.filter(order => 
        order.productid && order.productid.ownerid.toString() === req.owner.ownerid.toString()
    );
    res.render('admin_dashboard_sidebar/tickets',{orders})
})

//accept , wait list and decline orders

router.get('/acceptOrder/:oid',isOwner , async (req, res)=>{
    await orderModel.updateOne({_id:req.params.oid},{orderStatus:"accepted"},{new:true})
    req.flash('success','Order Accepted');
    res.redirect('/owners/tickets');
})

router.get('/declineOrder/:oid',isOwner , async (req, res)=>{
    await orderModel.updateOne({_id:req.params.oid},{orderStatus:"cancelled"},{new:true})
    req.flash('error','Order Cancelled');
    res.redirect('/owners/tickets');
})

router.get('/waitlistOrder/:oid',isOwner , async (req, res)=>{
    await orderModel.updateOne({_id:req.params.oid},{orderStatus:"pending"},{new:true})
    req.flash('error','Order Wait listed');
    res.redirect('/owners/tickets');
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
    let error = req.flash('error');
    let success = req.flash('success');
    res.render('admin_dashboard_sidebar/new_login',{error, success})
})

router.get('/messages',isOwner , async (req, res)=>{
    let messages = await messageModel.find().select('-_id');
    let ownerCompany = req.owner.company;
    let error = req.flash('error');
    let success = req.flash('success');
    res.render('admin_dashboard_sidebar/messages',{error, success, messages,ownerCompany})
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