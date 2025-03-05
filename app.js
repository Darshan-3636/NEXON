const express = require('express');
const path = require('path');
const app = express();
const cookieParser =  require('cookie-parser');
const db = require("./config/mongodb-connection");
const flash = require('connect-flash')
//routes
const indexRouter = require('./routes/index')
const ownerRouter = require('./routes/ownerRouter')

//middlewares
const isOwner = require('./middlewares/isOwner')

const expressSession = require("express-session");
const MongoStore = require("connect-mongo");
require('dotenv').config();

app.use(express.static(path.join(__dirname,'public')))
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(
    expressSession({
        resave:false,
        saveUninitialized:false,
        secret : process.env.EXPRESS_SESSION_SECRET,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
          }),
    })
)
app.use(flash());



// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); 

app.use('/', indexRouter);
app.use('/owners', isOwner , ownerRouter);

app.listen(3000);
