const express = require('express');
const router  = express.Router();
const isOwner  = require('../middlewares/isOwner');
const upload = require('../config/multer-config');
const ownerModel = require('../models/owner-model')
const productModel =  require('../models/product-model');
const messageModel = require('../models/message-model')
const orderModel = require('../models/order-model');
const userModel  = require('../models/user-model');
const empModel = require('../models/emp-model');

router.get('/users' , isOwner, async (req ,res)=>{
    let error = req.flash('error')
    let success = req.flash('success')
    const emps = await empModel.find({ownerid:req.owner.ownerid});
    res.render('admin_dashboard_sidebar/users',{owner:req.owner,emps,error , success})
})

router.get('/history', isOwner, async (req, res) => {
    try {
        const { month, year } = req.query; // Get month & year from query parameters
        let query = {}; // Initialize query

        if (month && year) {
            // Convert month & year to a date range
            const startDate = new Date(year, month - 1, 1); // First day of the selected month
            const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of the selected month

            query.date = { $gte: startDate, $lte: endDate };
        } else if (month) {
            // If only month is selected, find all orders from that month across all years
            query.$expr = { $eq: [{ $month: "$date" }, parseInt(month)] };
        } else if (year) {
            // If only year is selected, find all orders from that year across all months
            query.$expr = { $eq: [{ $year: "$date" }, parseInt(year)] };
        }

        const Raworders = await orderModel
            .find(query) // Apply dynamic filtering
            .populate('productid')
            .populate('userid')
            .sort({ date: -1 });

        // Filter only the orders belonging to the logged-in owner
        const orders = Raworders.filter(order =>
            order.productid && order.productid.ownerid.toString() === req.owner.ownerid.toString()
        );

        res.render('admin_dashboard_sidebar/history', {
            owner: req.owner,
            orders,
            selectedMonth: month || '',
            selectedYear: year || ''
        });
    } catch (error) {
        req.flash('error', 'Something Went Wrong');
        return res.redirect(req.get("Referrer") || "/");
    }
});


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
        totalAmount: (order.productid.price-order.productid.discount) * order.quantity  // Assuming `productid.price` exists
    }));

    const totalCustomers = [...new Set(orders.map(order => order.userid.toString()))].length;

    res.render('admin_dashboard_sidebar/analytics',{owner:req.owner,orders: processedOrders, totalCustomers})
})

router.get('/tickets', isOwner, async (req, res) => {
    try {
        const { month, year } = req.query; // Get month & year from query parameters
        let query = {}; // Initialize query

        if (month && year) {
            // Convert month & year to a date range
            const startDate = new Date(year, month - 1, 1); // First day of the selected month
            const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of the selected month

            query.date = { $gte: startDate, $lte: endDate };
        } else if (month) {
            // If only month is selected, find all orders from that month across all years
            query.$expr = { $eq: [{ $month: "$date" }, parseInt(month)] };
        } else if (year) {
            // If only year is selected, find all orders from that year across all months
            query.$expr = { $eq: [{ $year: "$date" }, parseInt(year)] };
        }

        const Raworders = await orderModel
            .find(query) // Apply dynamic filtering
            .populate('productid')
            .populate('userid')
            .sort({ date: -1 });

        // Filter only the orders belonging to the logged-in owner
        const orders = Raworders.filter(order =>
            order.productid && order.productid.ownerid.toString() === req.owner.ownerid.toString()
        );

        let error = req.flash('error')
        let success = req.flash('success')

        res.render('admin_dashboard_sidebar/tickets', {
            error,
            success,
            owner: req.owner,
            orders,
            selectedMonth: month || '',
            selectedYear: year || ''
        });
    } catch (error) {
        req.flash('error', 'Something Went Wrong');
        return res.redirect(req.get("Referrer") || "/");
    }
});


//accept , wait list and decline orders

router.get('/completeOrder/:oid',isOwner , async (req, res)=>{
    await orderModel.updateOne({_id:req.params.oid},{orderStatus:"completed"},{new:true})
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

router.get('/jobs', isOwner, async (req, res) => {
    try {
        let error = req.flash('error');
        let success = req.flash('success');

        // Fetch all products for the logged-in owner
        let products = await productModel.find({ ownerid: req.owner.ownerid });

        // Get total number of products
        let totalProducts = products.length;

        // Get start and end of the current month
        let startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        let endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

        // Fetch completed orders for this month, grouped by productId with total quantity
        let orderStats = await orderModel.aggregate([
            {
                $match: {
                    orderStatus: 'completed', // Only include completed orders
                    date: { $gte: startOfMonth, $lte: endOfMonth } // Filter by date
                }
            },
            {
                $group: {
                    _id: "$productid", // Group by productid directly
                    totalQuantity: { $sum: "$quantity" } // Sum the quantity field
                }
            },
            { $sort: { totalQuantity: -1 } } // Sort by highest quantity sold
        ]);
        
        

        let bestProduct = "No completed orders this month";
        let underProduct = "No completed orders this month";

        if (orderStats.length > 0) {
            let bestProductData = await productModel.findById(orderStats[0]._id);
            let underProductData = await productModel.findById(orderStats[orderStats.length - 1]._id);
        
            if (bestProductData) bestProduct = `${bestProductData.name} (${orderStats[0].totalQuantity} sold)`;
            if (underProductData) underProduct = `${underProductData.name} (${orderStats[orderStats.length - 1].totalQuantity} sold)`;
        }

        if (bestProduct === underProduct && bestProduct !== "No completed orders this month") {
            underProduct = "Not Sold Enough";
        }        
        

        res.render('admin_dashboard_sidebar/jobs', {
            owner: req.owner,
            error,
            success,
            products,
            totalProducts,
            bestProduct,
            underProduct
        });

    } catch (err) {
        req.flash('error', `Error: ${err.message}`);
        res.redirect('/admin_dashboard');
    }
});



router.get('/calendar', isOwner, async (req, res) => {
    try {
        let error = req.flash('error')
        let success = req.flash('success')
        res.render('admin_dashboard_sidebar/calendar', { owner:req.owner, error , success });
    } catch (err) {
        req.flash('error',`${err}`)
        res.redirect('/admin_dashboard');
    }
});


router.get('/new_emp',isOwner , async (req, res)=>{
    let error = req.flash('error');
    let success = req.flash('success');
    res.render('admin_dashboard_sidebar/new_login',{owner:req.owner, error, success})
})

router.get('/messages',isOwner , async (req, res)=>{
    let messages = await messageModel.find({ownerid:req.owner.ownerid}).select('-_id');
    let error = req.flash('error');
    let success = req.flash('success');
    res.render('admin_dashboard_sidebar/messages',{owner:req.owner , error, success, messages})
})



// create product route

router.get('/createproduct',isOwner ,async  (req, res)=>{
    let error = req.flash('error');
    let success = req.flash('success');
    res.render('admin_dashboard_sidebar/createProduct',{owner:req.owner,error, success})
})

router.post('/create', isOwner, upload.single('image'), async (req, res)=>{
    try{
        let {name, price, discount,stock, bgcolor, panelcolor, textcolor, description} = req.body;

        let createdProduct = await productModel.create({
            image: req.file.buffer,
            name,
            price,
            discount,
            stock,
            bgcolor,
            panelcolor,
            textcolor,
            description,
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