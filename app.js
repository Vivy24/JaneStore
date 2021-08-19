'use strict';


const express = require('express');
const session=require('express-session');
const bodyParser=require('body-parser');
const mongoose=require('mongoose');
const MongoDBStore=require('connect-mongodb-session')(session);

const Security=require('./lib/security');

const Cart=require('./lib/cart');
const Config=require('./lib/config.js');

const app=express()
const port = process.env.PORT || 8000;

mongoose.connect(Config.db.url,{
  useNewUrlParser:true,
  useUnifiedTopology: true 
})

const products=require('./lib/model/Product.js');

const store= new MongoDBStore({
  uri: Config.db.url,
  collection: Config.db.sessions
})
app.set("view engine","ejs")
app.use(express.static("public"));
app.use(session({
  secret: Config.secret,
  resave: false,
  saveUninitialized: true,
  store:store,
  unset:'destroy',
  name:'shopping cart',
  genid: (req) =>{
    return Security.generateId()
  }
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/', (req, res) => {
  if(!req.session.cart){
    req.session.cart={
      items:[],
      totals:0.00,
      formattedTotals:''
    }
  }
  res.render("index.ejs")
});

app.get("/lipsticks", (req,res)=>{
  res.render("lipsticks.ejs",{ nonce: Security.md5(req.sessionID + req.headers['user-agent'])})
})

app.get("/masks", (req,res)=>{
  res.render("masks.ejs")
})


app.get("/cart", (req,res)=>{
    const userSess = req.session;
    const cart=(typeof userSess.cart !=="undefined") ? userSess.cart : false;
    res.render('carts.ejs', {
        cart: cart,
        nonce: Security.md5(req.sessionID+ req.headers['user-agent'])
    })
})

app.post('/addlipsticks',(req,res)=>{
  const token=req.body.nonce;
  const colorValue=req.body.lipColor;
  const qty=req.body.qty;
  if(Security.isValidNonce(token,req) && qty>0){
     products.findOne({codeColor:colorValue}, function(err,prod){
        if(err){
         res.redirect("/lipsticks")
        }
        else{
          const cart= (req.session.cart) ? req.session.cart: null;
          Cart.addToCart(prod, qty,cart);
          res.redirect('/cart');
        }
       })
    }
     else{
       res.redirect('/lipsticks')
     }
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
});
