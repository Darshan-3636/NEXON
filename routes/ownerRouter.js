const express = require('express');
const router  = express.Router();


router.get('/users' , (req ,res)=>{
    res.render('admin_dashboard_sidebar/users')
})

router.get('/history', (req, res)=>{
    res.render('admin_dashboard_sidebar/history')
})

router.get('/analytics',(req, res)=>{
    res.render('admin_dashboard_sidebar/analytics')
})

router.get('/tickets', (req, res)=>{
    res.render('admin_dashboard_sidebar/tickets')
})

router.get('/jobs', (req, res)=>{
    res.render('admin_dashboard_sidebar/jobs')
})

router.get('/calendar', (req, res)=>{
    res.render('admin_dashboard_sidebar/calendar')
})

router.get('/settings', (req, res)=>{
    res.render('admin_dashboard_sidebar/settings')
})

router.get('/new_emp', (req, res)=>{
    res.send('page not found 404 ;)')
})

router.get('/createproduct', (req, res)=>{
    res.send('page not found 404 ;)')
})


module.exports = router;