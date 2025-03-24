const express = require('express');
const router =  express.Router();
const {message,registerOwner,login,logoutOwner} =  require('../controllers/indexController');
const upload = require('../config/multer-config');
const isOwner = require("../middlewares/isOwner");
const ownerModel = require('../models/owner-model');
const productModel = require('../models/product-model');
const empModel = require('../models/emp-model');
const bcrypt = require('bcrypt');
const orderModel = require('../models/order-model');
const todoModel = require('../models/todo-model')

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

//create new employee route 
router.post('/new_login', upload.single('image'), isOwner, async (req, res) => {
    try {
        const { password, email , phone, username } = req.body;

        
        const userExists = await empModel.findOne({ username });

        if (userExists) {
            req.flash('error', 'UserName Already Taken');
            return res.redirect('/owners/new_emp');
        } 
        
        const emailExists = await empModel.findOne({ email });

        if (emailExists) {
            req.flash('error', 'Email Already Taken');
            return res.redirect('/owners/new_emp');
        } 
        
        const phoneExists = await empModel.findOne({ phone });

        if (phoneExists) {
            req.flash('error', 'Phone Number Already Exists');
            return res.redirect('/owners/new_emp');
        } 
       
        
        if (!username || username.trim() === "") {
            req.flash('error', 'Username Cannot Be Empty');
            return res.redirect('/owners/new_emp');
        }
        
        if (!email || email.trim() === "") {
            req.flash('error', 'Email Cannot Be Empty');
            return res.redirect('/owners/new_emp');
        }
        
        if (!phone || phone.trim() === "") {
            req.flash('error', 'Phone Number Cannot Be Empty');
            return res.redirect('/owners/new_emp');
        }

        bcrypt.genSalt(10,(err,salt)=>{
            bcrypt.hash(password, salt, async (err,hash)=>{
                if(err){
                    req.flash('error',`${err}`);
                    res.redirect('/owners/new_emp');
                }else{
                    await empModel.create({
                        email,
                        password:hash, 
                        phone, 
                        username, 
                        picture: req.file.buffer,
                        company:req.owner.company,
                        ownerid:req.owner.ownerid
                        },
                    )
                    req.flash('success', 'Employee created successfully');
                    res.redirect('/owners/new_emp');
                }
            })
        })        
    } catch (err) {
        console.error('Error:', err); // Log the error for debugging
        req.flash('error', 'Something went wrong');
        res.redirect('/owners/new_emp');
    }
});

//remove employee
router.get('/removeemp/:eid', isOwner , async (req,res)=>{
    await empModel.deleteOne({_id:req.params.eid})
    req.flash('success','Employee Removed');
    res.redirect('/owners/users');
})

//admin_dashboard

router.get('/admin_dashboard',isOwner, async (req, res)=>{
    let emps = await empModel.find({ownerid:req.owner.ownerid})

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

        const latestOrders = processedOrders
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
    
        const totalCustomers = [...new Set(orders.map(order => order.userid.toString()))].length;

    let success = req.flash('success')
    let error = req.flash('error')
    res.render('admin_dashboard',{success, error,owner:req.owner,emps,orders: processedOrders, totalCustomers,latestOrders});
})

//calender
router.post('/calendar', isOwner, async (req, res) => { 
    try {
        const { title, start, description, backgroundColor, borderColor } = req.body;

        // Ensure start is correctly formatted
        const eventDate = new Date(start);

        if (!start || isNaN(eventDate.getTime())) {
            req.flash('error', 'Invalid date format');
            return res.redirect('/owners/calendar');
        }

        const newEvent = { 
            title, 
            start: eventDate.toISOString(),  // Store date in correct format
            description, 
            backgroundColor, 
            borderColor 
        };

        const owner = await ownerModel.findById(req.owner._id);
        const emp = await empModel.findById(req.owner._id);
        if (owner) {
            owner.events.push(newEvent);
            await owner.save();
            console.log("it works in owner")
        } else  {
            emp.events.push(newEvent);
            await emp.save();
            console.log("it works in emp")
        }

        

        req.flash('success', 'Created New Event');
        res.redirect('/owners/calendar');
    } catch (err) {
        req.flash('error', `Error: ${err.message}`);
        res.redirect('/owners/calendar');
    }
});

router.get('/deleteEvent/:eid', isOwner , async (req, res)=>{
    let owner = await ownerModel.findOne({_id:req.owner.ownerid})
    let eventId = req.params.eid;
    try{
        //check owner
        if(!owner){
            req.flash('error','owner Not found');
            return res.redirect('/login')
        }

        //check event
        const eventExists = owner.events.some(event => event._id.toString() === eventId);
        if (!eventExists) {
            req.flash('error',"Event Doesn't Exists")
            return res.redirect(req.get("Referrer") || "/");
        }

        //remove event
        await ownerModel.findByIdAndUpdate(
            req.owner.ownerid,
            { $pull: { events: { _id: eventId } } },
            { new: true }
        );
        req.flash('success','Event removed');
        return res.redirect(req.get("Referrer") || "/");

    }
    catch(err){
        req.flash('error',err.message);
        return res.redirect(req.get("Referrer") || "/");

    }
})


router.get('/test',isOwner,(req, res)=>{
    res.send(req.owner)
})
//logout

router.get('/logoutPage',isOwner,(req, res)=>{
    
    res.render('admin_dashboard_sidebar/logout',{owner:req.owner})
})

router.get('/logout', logoutOwner)


module.exports = router;
