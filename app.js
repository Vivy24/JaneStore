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
const orders=require("./lib/model/Order.js");

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
  if (!req.session.userId){
    req.session.userId=req.headers['user-agent']
  }
  res.render("index.ejs")
});

app.get("/lipsticks", (req,res)=>{
  const nonExist=req.query.nonExist;
  const showModal=req.query.cart;
  res.render("lipsticks.ejs",{ nonExist: nonExist, showModal: showModal ,nonce: Security.md5(req.sessionID + req.headers['user-agent'], )})
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

app.get("/cart/remove/:id/:nonce", (req,res)=>{
  const id=req.params.id;
  const nonce=req.params.nonce;
  if(Security.isValidNonce(nonce,req)){
    const message = Cart.removeFromCart(id,req.session.cart);
    if (message==="Successfully delete"){
      res.redirect("/cart")
    }
    else {
    res.redirect("/lipsticks") }

  }
  else {
    res.redirect("/lipsticks")
  }
})

app.get('/cart/empty/:nonce',(req,res)=>{
    if(Security.isValidNonce(req.params.nonce,req)){
      Cart.emptyCart(req);
      res.redirect("/cart");
    }
    else {
      res.redirect("/lipsticks")
    }
})

app.get("/checkout",(req,res)=>{
  const userSession=req.session;
  const cart=(typeof userSession.cart!=='undefined') ? userSession.cart:false;
  const message=req.query.message;
  const showModal=req.query.ordered;
  console.log(showModal);
  res.render('checkout', {
    pageTitle: 'Checkout',
    cart:cart,
    checkoutDone: false,
    message:message,
    showModal:showModal,
    nonce: Security.md5(req.sessionID + req.headers['user-agent'])
  })
})

app.post("/checkout",(req,res)=>{
  const nonce=req.body.nonce;

  if(Security.isValidNonce(nonce,req)){
      const userId=req.session.userId;
      const cart=req.session.cart
      const form=req.body;
      const order= new orders({
        userId: userId,
        items: cart.items,
        totals: cart.totals,
        firstName: form.firstname,
        lastName: form.lastname,
        email: form.email,
        address: `${form.address} , ${form.city} , ${form.zip}`,
        status: "Waiting for process"
       })
      
       order.save(function(err){
          if (err){
            console.log(err)
          }
       })

      Cart.emptyCart(req);
      res.redirect("/checkout?ordered=true");
  }


})


app.post("/cart/update",(req,res)=>{
  const ids=req.body["product_id[]"];
  const qtys=req.body["qty[]"];
  const nonce=req.body.nonce;
  if(Security.isValidNonce(nonce,req)){
    const cart=(req.session.cart) ? req.session.cart:null;
    const i= (!Array.isArray(ids)) ? [ids]:ids;
    const q=(!Array.isArray(qtys)) ? [qtys]:qtys;
    Cart.updateCart(i,q,cart);
    res.redirect("/cart")
  }
  else {
    res.redirect("/lipsticks")
  }
})

app.post('/addlipsticks',(req,res)=>{
  const token=req.body.nonce;
  const colorValue=req.body.lipColor;
  const qty=req.body.qty;
  if(Security.isValidNonce(token,req) && qty>0){
     products.findOne({codeColor:colorValue}, function(err,prod){
        if(err){
         res.redirect("/lipsticks?nonExist=true")
        }
        else{
          const cart= (req.session.cart) ? req.session.cart: null;
          Cart.addToCart(prod, qty,cart);
          res.redirect('/lipsticks?cart=true');
        }
       })
    }
     else{
       res.redirect('/lipsticks')
     }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
});
