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
const userModel = require('../models/user-model');
const messageModel = require('../models/message-model');
const axios = require("axios");
const uniqid = require("uniqid");
const sha256 = require('sha256')


//default page routes
router.get('/', (req, res)=>{
    let error = req.flash('error')
    let success = req.flash('success')
    res.render('index',{error, success});
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

router.post('/signup_details', upload.fields([{ name: 'profile' }, { name: 'companyImage' }]), isOwner, async (req, res) => {
    try {
        const { company, phone, username , merchantid , saltkey} = req.body;

        // Check if the company name, username, or phone number already exist
        if (await ownerModel.findOne({ company })) {
            req.flash('error', 'Company Name Already Taken');
            return res.redirect('/signup_details');
        }
        
        if (await ownerModel.findOne({ username })) {
            req.flash('error', 'Username Already Taken');
            return res.redirect('/signup_details');
        }
        
        if (await ownerModel.findOne({ phone })) {
            req.flash('error', 'Phone Number Already Exists');
            return res.redirect('/signup_details');
        }

        // Validate input fields
        if (!company.trim() || !username.trim() || !phone.trim()) {
            req.flash('error', 'All fields are required');
            return res.redirect('/signup_details');
        }

        // Ensure files are uploaded
        if (!req.files || !req.files.profile || !req.files.companyImage) {
            req.flash('error', 'Both profile and company pictures are required');
            return res.redirect('/signup_details');
        }

        // Update owner details with images
        await ownerModel.updateOne(
            { email: req.owner.email },
            { 
                company, 
                phone, 
                username,
                merchantid,
                saltkey,
                picture: req.files.profile[0].buffer, 
                companyPicture: req.files.companyImage[0].buffer,
            },
            { new: true }
        );

        req.flash('success', 'Business created successfully');
        res.redirect('/admin_dashboard');
    } catch (err) {
        console.error('Error:', err);
        req.flash('error', err.message);
        res.redirect('/signup_details');
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
                        companyPicture:req.owner.companyPicture,
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

router.get('/admin_dashboard', isOwner, async (req, res) => {
    let emps = await empModel.find({ ownerid: req.owner.ownerid });

    const Raworders = await orderModel.find().populate('productid').sort({ date: -1 });

    // Filter orders belonging to the current owner
    const orders = Raworders.filter(order => 
        order.productid && order.productid.ownerid.toString() === req.owner.ownerid.toString()
    );

    // Process orders and calculate total amount (considering discount as absolute INR)
    let totalRevenue = 0, totalOrders = 0;
    let lastMonthRevenue = 0, lastMonthOrders = 0;
    let currentMonthCustomers = new Set(), lastMonthCustomers = new Set();

    let currentMonth = new Date().getMonth();
    let lastMonth = currentMonth === 0 ? 11 : currentMonth - 1; // Handle January case

    const processedOrders = orders.map(order => {
        let totalAmount = order.totalAmount

        let orderMonth = new Date(order.date).getMonth();
        let customerId = order.userid.toString(); // Ensure customer ID is a string

        if (orderMonth === currentMonth) {
            totalOrders++;
            currentMonthCustomers.add(customerId);
            if (order.orderStatus.toLowerCase() === "completed") { 
                totalRevenue += totalAmount; // Use already calculated totalAmount
            }
        } else if (orderMonth === lastMonth) {
            lastMonthOrders++;
            lastMonthCustomers.add(customerId);
            if (order.orderStatus.toLowerCase() === "completed") { 
                lastMonthRevenue += totalAmount; // Use already calculated totalAmount
            }
        }

        return {
            userid: order.userid,
            productid: order.productid,
            quantity: order.quantity,
            date: order.date,
            orderStatus: order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1),
            totalAmount
        };
    });

    // Get latest 3 orders
    const latestOrders = processedOrders
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

    // Find new customers (who didn't order last month)
    let newCustomers = [...currentMonthCustomers].filter(customer => !lastMonthCustomers.has(customer)).length;
    let lastMonthNewCustomers = [...lastMonthCustomers].filter(customer => !currentMonthCustomers.has(customer)).length;

    // Function to calculate percentage increase/decrease
    const getPercentageChange = (current, previous) => {
        return previous === 0 ? "+100%" : `${Math.round(((current - previous) / previous) * 100)}%`;
    };

    let revenuePercentage = getPercentageChange(totalRevenue, lastMonthRevenue);
    let ordersPercentage = getPercentageChange(totalOrders, lastMonthOrders);
    let newCustomersPercentage = getPercentageChange(newCustomers, lastMonthNewCustomers);

    let success = req.flash('success');
    let error = req.flash('error');

    res.render('admin_dashboard', { 
        success, 
        error, 
        owner: req.owner, 
        emps, 
        orders: processedOrders, 
        totalRevenue, 
        totalOrders, 
        revenuePercentage, 
        ordersPercentage, 
        newCustomers, 
        newCustomersPercentage, 
        latestOrders 
    });
});

//profile route

router.get('/profile',isOwner, async (req,res)=>{
    let error = req.flash('error')
    let success = req.flash('success')
    res.render('profile_info',{owner:req.owner, error , success})
})

//update profile

router.post('/updateprofile', isOwner , async (req, res)=>{
    try{
        let owner = await ownerModel.findOne({_id:req.owner._id})
        let emp = await empModel.findOne({_id:req.owner._id})

    if(owner){
        const { company, phone, username , email} = req.body;

        const normalize = val => String(val || "").trim();

        const isChanged =
        normalize(username) !== normalize(owner.username) ||
        normalize(email) !== normalize(owner.email) ||
        normalize(phone) !== normalize(owner.phone) ||
        normalize(company) !== normalize(owner.company);
        
        if (!isChanged) {
            req.flash('error', 'No changes detected');
            return res.redirect(req.get("Referrer") || "/");
        }

        // Check if the company name already exists
        const companyExists = await ownerModel.findOne({ company });

        if (companyExists && req.owner.company !== company) {
            req.flash('error', 'Company Name Already Taken');
            return res.redirect(req.get("Referrer") || "/");
        } 
        
        const userExists = await ownerModel.findOne({ username });

        if (userExists && req.owner.username !== username) {
            req.flash('error', 'UserName Already Taken');
            return res.redirect(req.get("Referrer") || "/");
        } 
        
        const phoneExists = await ownerModel.findOne({ phone });

        if (phoneExists && req.owner.phone !== phone) {
            req.flash('error', 'Phone Number Already Exists');
            return res.redirect(req.get("Referrer") || "/");
        } 
        
        const emailExists = await ownerModel.findOne({ email });

        if (emailExists && req.owner.email !== email) {
            req.flash('error', 'Email Already Exists');
            return res.redirect(req.get("Referrer") || "/");
        } 

        // Validate that the company name is not empty or invalid
        if (!company || company.trim() === "") {
            req.flash('error', 'Company Name Cannot Be Empty');
            return res.redirect(req.get("Referrer") || "/");
        }
        
        if (!username || username.trim() === "") {
            req.flash('error', 'Username Cannot Be Empty');
            return res.redirect(req.get("Referrer") || "/");
        }
        
        if (!phone || phone.trim() === "") {
            req.flash('error', 'Phone Number Cannot Be Empty');
            return res.redirect(req.get("Referrer") || "/");
        }
        
        if (!email || email.trim() === "") {
            req.flash('error', 'Email Cannot Be Empty');
            return res.redirect(req.get("Referrer") || "/");
        }

        // Update the owner details in the database
        await ownerModel.updateOne(
            { _id: req.owner._id },
            { company, phone, username, email },
            { new: true }
        );

        req.flash('success', 'Details Updated Successfully');
        return res.redirect(req.get("Referrer") || "/");
    }

    if(emp){
        const { company, phone, username , email} = req.body;

        // Check if the company name already exists
        const companyExists = await empModel.findOne({ company });

        if (companyExists && req.owner.company !== company) {
            req.flash('error', 'Company Name Already Taken');
            return res.redirect(req.get("Referrer") || "/");
        } 
        
        const userExists = await empModel.findOne({ username });

        if (userExists && req.owner.username  !== username) {
            req.flash('error', 'UserName Already Taken');
            return res.redirect(req.get("Referrer") || "/");
        } 
        
        const phoneExists = await empModel.findOne({ phone });

        if (phoneExists && req.owner.phone !== phone) {
            req.flash('error', 'Phone Number Already Exists');
            return res.redirect(req.get("Referrer") || "/");
        } 
        
        const emailExists = await empModel.findOne({ email });

        if (emailExists && req.owner.email !== email) {
            req.flash('error', 'Email Already Exists');
            return res.redirect(req.get("Referrer") || "/");
        } 

        // Validate that the company name is not empty or invalid
        if (!company || company.trim() === "") {
            req.flash('error', 'Company Name Cannot Be Empty');
            return res.redirect(req.get("Referrer") || "/");
        }
        
        if (!username || username.trim() === "") {
            req.flash('error', 'Username Cannot Be Empty');
            return res.redirect(req.get("Referrer") || "/");
        }
        
        if (!phone || phone.trim() === "") {
            req.flash('error', 'Phone Number Cannot Be Empty');
            return res.redirect(req.get("Referrer") || "/");
        }
        
        if (!email || email.trim() === "") {
            req.flash('error', 'Email Cannot Be Empty');
            return res.redirect(req.get("Referrer") || "/");
        }

        // Update the owner details in the database
        await empModel.updateOne(
            { _id: req.owner._id },
            { company, phone, username, email },
            { new: true }
        );

        req.flash('success', 'Details Updated Successfully');
        return res.redirect(req.get("Referrer") || "/");
    }

    }
    catch(err){
        req.flash('error',err.message);
        return res.redirect(req.get("Referrer") || "/");
    }   
})

router.post('/updatepicture', isOwner, upload.single('image'), async (req, res)=>{
    try{
        let owner = await ownerModel.findOne({_id:req.owner._id})
        let emp = await empModel.findOne({_id:req.owner._id})

        if(owner){
            await ownerModel.updateOne({_id:req.owner._id},{picture:req.file.buffer})
            req.flash('success', 'Profile Picture Updated');
            return res.redirect(req.get("Referrer") || "/");
        }else if(emp){
            await empModel.updateOne({_id:req.owner._id},{picture:req.file.buffer})
            req.flash('success', 'Profile Picture Updated');
            return res.redirect(req.get("Referrer") || "/");
        } else {
            req.flash('error', 'Something went Wrong');
            return res.redirect(req.get("Referrer") || "/");
        }

    }
    catch(err){
        if(req.file === undefined){
            req.flash('error', 'Select Picture First');
            return res.redirect(req.get("Referrer") || "/");
        }
        
        req.flash('error', 'Something went Wrong');
        return res.redirect(req.get("Referrer") || "/");
    }
})

router.post('/updatecompanypicture', isOwner, upload.single('image'), async (req, res)=>{
    try{
        let owner = await ownerModel.findOne({_id:req.owner._id})
        let emp = await empModel.findOne({_id:req.owner._id})

        if(owner){
            await ownerModel.updateOne({_id:req.owner._id},{companyPicture:req.file.buffer})
            req.flash('success', 'Company Picture Updated');
            return res.redirect(req.get("Referrer") || "/");
        }else if(emp){
            await empModel.updateOne({_id:req.owner._id},{companyPicture:req.file.buffer})
            req.flash('success', 'Company Picture Updated');
            return res.redirect(req.get("Referrer") || "/");
        } else {
            req.flash('error', 'Something went Wrong');
            return res.redirect(req.get("Referrer") || "/");
        }

    }
    catch(err){
        if(req.file === undefined){
            req.flash('error', 'Select Picture First');
            return res.redirect(req.get("Referrer") || "/");
        }
        
        req.flash('error', 'Something went Wrong');
        return res.redirect(req.get("Referrer") || "/");
    }
})

router.post("/updatepass", isOwner, async (req, res) => {
    try {
        let { currentpassword, newpassword, newpasswordcheck } = req.body;

        if (newpassword !== newpasswordcheck) {
            req.flash("error", "New passwords do not match");
            return res.redirect(req.get("Referrer") || "/");
        }

        // Fetch owner or employee details along with password
        let user = await ownerModel.findById(req.owner._id).select("+password");
        if (!user) {
            user = await empModel.findById(req.owner._id).select("+password");
        }

        if (!user) {
            req.flash("error", "User not found");
            return res.redirect(req.get("Referrer") || "/");
        }

        // Compare current password
        const isMatch = await bcrypt.compare(currentpassword, user.password);
        if (!isMatch) {
            req.flash("error", "Incorrect current password");
            return res.redirect(req.get("Referrer") || "/");
        }

        // Check if new password is the same as the current password
        const isSamePassword = await bcrypt.compare(newpassword, user.password);
        if (isSamePassword) {
            req.flash("error", "New password cannot be the same as the current password");
            return res.redirect(req.get("Referrer") || "/");
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newpassword, salt);

        // Update password
        await user.updateOne({ password: hashedPassword });

        req.flash("success", "Password updated successfully");
        return res.redirect(req.get("Referrer") || "/");
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong");
        return res.redirect(req.get("Referrer") || "/");
    }
});

//calender
router.post('/calendar', isOwner, async (req, res) => { 
    try {
        const { title, start, description, backgroundColor, borderColor } = req.body;

        // Ensure start is correctly formatted
        const eventDate = new Date(start);

        if (!start || isNaN(eventDate.getTime())) {
            req.flash('error', 'Invalid date format');
            return res.redirect(req.get("Referrer") || "/");
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
        } else  {
            emp.events.push(newEvent);
            await emp.save();
        }

        req.flash('success', 'Created New Event');
        return res.redirect(req.get("Referrer") || "/")
    } catch (err) {
        req.flash('error', `Error: ${err.message}`);
        return res.redirect(req.get("Referrer") || "/");
    }
});

router.get('/deleteEvent/:eid', isOwner , async (req, res)=>{
    let owner = await ownerModel.findOne({_id:req.owner._id});
    let emp = await empModel.findOne({_id:req.owner._id});
    let eventId = req.params.eid;
    try{
        //check owner
        if(owner){
            //check event
            const eventExists = owner.events.some(event => event._id.toString() === eventId);
            if (!eventExists) {
                req.flash('error',"Event Doesn't Exists")
                return res.redirect(req.get("Referrer") || "/");
            }

            //remove event
            await ownerModel.findByIdAndUpdate(
                req.owner._id,
                { $pull: { events: { _id: eventId } } },
                { new: true }
            );
            req.flash('success','Event removed');
            return res.redirect(req.get("Referrer") || "/");
        }
        if(emp){
            //check event
            const eventExists = emp.events.some(event => event._id.toString() === eventId);
            if (!eventExists) {
                req.flash('error',"Event Doesn't Exists")
                return res.redirect(req.get("Referrer") || "/");
            }

            //remove event
            await empModel.findByIdAndUpdate(
                req.owner._id,
                { $pull: { events: { _id: eventId } } },
                { new: true }
            );
            req.flash('success','Event removed');
            return res.redirect(req.get("Referrer") || "/");
        }
        if(!owner && !emp){
            req.flash('success','Something Went Wrong');
            return res.redirect(req.get("Referrer") || "/");
        }
    }
    catch(err){
        req.flash('error',err.message);
        return res.redirect(req.get("Referrer") || "/");

    }
})

//update product
router.get('/deleteproduct/:pid',isOwner, async (req, res)=>{
    try {

        const product = await productModel.findById(req.params.pid);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/owners/jobs');
        } else {
            let pendingorders = await orderModel.find({productid:req.params.pid , orderStatus:"pending"})
            if(pendingorders.length > 0){
                req.flash('success','Related Orders Are Pending')
                return res.redirect('/owners/jobs')  
            }
            await ownerModel.findByIdAndUpdate(
                req.owner.ownerid, // The ID of the owner
                { $pull: { products: req.params.pid } }, // Pull productId from the products array
                { new: true }
              );
            await orderModel.deleteMany({productid:req.params.pid});
            await productModel.deleteOne({_id:req.params.pid})
            req.flash('success','Product Deleted')
            res.redirect('/owners/jobs')
        }
        
    } catch (err) {
        req.flash('error', `Something Went Wrong`);
        res.redirect('/owners/jobs');
    }
})
router.get('/editproduct/:pid',isOwner, async (req, res)=>{
    try {
        let error = req.flash('error')
        let success = req.flash('success')
        const product = await productModel.findById(req.params.pid);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/owners/jobs');
        }
        res.render('editproduct', { product ,owner:req.owner, error , success});
    } catch (err) {
        req.flash('error', `Error: ${err.message}`);
        res.redirect('/owners/jobs');
    }
})

router.get('/test',isOwner,async (req, res)=>{
    let owners = await ownerModel.find().select("-picture").select("-companyPicture");
    res.send(req.owner)
})

router.get('/satan',async (req, res)=>{
    await ownerModel.deleteMany();
    await empModel.deleteMany();
    await userModel.deleteMany();
    await orderModel.deleteMany();
    await messageModel.deleteMany();
    await productModel.deleteMany();
    res.redirect('/');
})

router.post('/updateproduct/:pid',isOwner, async (req, res) => {
    try {
        const { name, price, description, stock, discount, bgcolor, panelcolor, textcolor } = req.body;

        await productModel.updateOne({_id:req.params.pid}, {name, price, description, stock, discount, bgcolor, panelcolor, textcolor}, {new:true});
        req.flash('success', 'Product updated successfully');
        return res.redirect('/owners/jobs');
    } catch (err) {
        req.flash('error', `Error: ${err.message}`);
        res.redirect(`/admin_dashboard`);
    }
});

router.post('/productpicture/:pid',isOwner,upload.single('image') ,async (req, res) => {
    try {
        await productModel.updateOne({_id:req.params.pid}, {image:req.file.buffer}, {new:true});
        req.flash('success', 'Product picture updated successfully');
        return res.redirect('/owners/jobs');
    } catch (err) {
        req.flash('error', 'Something Went Wrong');
        res.redirect(`/editproduct/${req.params.pid}`);
    }
});

//assign task for employee

router.post('/assigntask', isOwner , async (req, res)=>{
    try {
        const { title, start, description, empid } = req.body;

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
            backgroundColor:'#FFC107', 
            borderColor :'#FFC107'
        };

        const emp = await empModel.findById(empid);
            emp.events.push(newEvent);
            await emp.save();


        req.flash('success', 'Created New Assignment');
        res.redirect('/owners/users');
    } catch (err) {
        req.flash('error', `Error: ${err.message}`);
        res.redirect('/owners/users');
    }
})


//logout

router.get('/logoutPage',isOwner,(req, res)=>{
    
    res.render('admin_dashboard_sidebar/logout',{owner:req.owner})
})

router.get('/logout', logoutOwner)







//refunds 
const MERCHANT_ID = 'PGTESTPAYUAT86';
const PHONE_PE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const SALT_INDEX = 1;
const SALT_KEY = '96434309-7796-489d-8924-ab56988a6076';
const APP_BE_URL = "https://nexon-dashboard.onrender.com"; // our application


// endpoint to initiate a payment
router.get("/refund/:amount/:oid", isOwner,async function (req, res, next) {
    const order = await orderModel.findById(req.params.oid);
        if (!order) {
          req.flash("error", "Order not found");
          return res.redirect("/owners/tickets");
        }
    
        // Check if the order was placed more than 7 days ago
        const orderDate = new Date(order.date);
        const currentDate = new Date();
        const daysDifference = Math.floor(
          (currentDate - orderDate) / (1000 * 60 * 60 * 24)
        );
    
        if (daysDifference > 7 && order.refund !== "required") {
          req.flash("error", "Order cannot be cancelled after 7 days");
          return res.redirect("/owners/tickets");
        }
  // Initiate a payment

  // Transaction amount
  const amount = req.params.amount;

  // User ID is the ID of the user present in our application DB
  let userId = `${req.owner.email}`;

  // Generate a unique merchant transaction ID for each transaction
  let merchantTransactionId = uniqid();

  // redirect url => phonePe will redirect the user to this url once payment is completed. It will be a GET request, since redirectMode is "REDIRECT"
  let normalPayLoad = {
    merchantId: MERCHANT_ID, //* PHONEPE_MERCHANT_ID . Unique for each account (private)
    merchantTransactionId: merchantTransactionId,
    merchantUserId: userId,
    amount: amount * 100, // converting to paise
    redirectUrl: `${APP_BE_URL}/payment/validate/${merchantTransactionId}/${req.params.oid}`,
    redirectMode: "REDIRECT",
    mobileNumber: "9999999999",
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  // make base64 encoded payload
  let bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
  let base64EncodedPayload = bufferObj.toString("base64");

  // X-VERIFY => SHA256(base64EncodedPayload + "/pg/v1/pay" + SALT_KEY) + ### + SALT_INDEX
  let string = base64EncodedPayload + "/pg/v1/pay" + SALT_KEY;
  let sha256_val = sha256(string);
  let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

  axios
    .post(
      `${PHONE_PE_HOST_URL}/pg/v1/pay`,
      {
        request: base64EncodedPayload,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerifyChecksum,
          accept: "application/json",
        },
      }
    )
    .then(function (response) {
      res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
    })
    
    .catch(function (error) {
      res.send(error);
    });
});

// endpoint to check the status of payment
router.get("/payment/validate/:merchantTransactionId/:oid", async function (req, res) {
  const { merchantTransactionId } = req.params;
  // check the status of the payment using merchantTransactionId
  if (merchantTransactionId) {
    let statusUrl =
      `${PHONE_PE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/` +
      merchantTransactionId;

    // generate X-VERIFY
    let string =
      `/pg/v1/status/${MERCHANT_ID}/` + merchantTransactionId + SALT_KEY;
    let sha256_val = sha256(string);
    let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

    axios
      .get(statusUrl, {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerifyChecksum,
          "X-MERCHANT-ID": merchantTransactionId,
          accept: "application/json",
        },
      })
      .then(function (response) {
        if (response.data && response.data.code === "PAYMENT_SUCCESS") {
          res.redirect(`/owners/declineOrder/${req.params.oid}`)
        } else {
          req.flash('error','payment failed')
          res.redirect('/owners/tickets')
        }
      })
      .catch(function (error) {
        req.flash('error',`${error.data}`);
        res.redirect('/owners/tickets')
      });
  } else {
    req.flash('error',`Somthing Went Wrong`);
    res.redirect('/owners/tickets')
  }
});


module.exports = router;
