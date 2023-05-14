//https://www.youtube.com/watch?v=im2HX7Lzy6M

const express = require("express");
const app = express();
// for the security
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');





dotenv.config({ path: './.env'});

const mysql = require("mysql");

const db = mysql.createConnection({
    host:process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER ,
    password:process.env.DATABASE_PASSWORD,
    database:process.env.DATABASE,
    port: 8889
});

app.set('view engine', 'hbs');
//Directory direction
const publicDirection = path.join(__dirname, './public');
app.use(express.static(publicDirection));
//parse url-encoded bodies (as sent by html forms)
app.use(express.urlencoded({extended : false}));
app.use(express.json());
app.use(cookieParser());


db.connect((error)=>{
    if(error){
        console.log(error)
    }else{
        console.log("MYSQL connected...")
    }
});

//define routes
app.use('/',require('./routes/pages'));
//parse json bodies(as sent by api clients)
app.use('/auth',require('./routes/auth'));

app.listen(6001, ()=>{
    console.log("Server started on port 6001")
});