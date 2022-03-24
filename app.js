"use strict";
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const MongoDBStore = require("connect-mongodb-session")(session);
const passport = require("passport");
const flash = require("connect-flash");

const Security = require("./lib/security");
const Cart = require("./lib/cart");
const auth = require("./lib/auth.js");

const app = express();
const port = process.env.PORT || 8000;

const products = require("./lib/model/Product.js");
const orders = require("./lib/model/Order.js");
const admins = require("./lib/model/Admin.js");

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: true,
});

const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: process.env.DB_SESSIONS,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: store,
    unset: "destroy",
    name: "shopping cart",
    genid: (req) => {
      return Security.generateId();
    },
  })
);

require("./lib/passport");
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  if (!req.session.cart) {
    req.session.cart = {
      items: [],
      totals: 0.0,
      formattedTotals: "",
    };
  }
  res.render("index.ejs");
});

app.get("/lipsticks", (req, res) => {
  const nonExist = req.query.nonExist;
  const showModal = req.query.cart;
  res.render("lipsticks.ejs", {
    nonExist: nonExist,
    showModal: showModal,
    nonce: Security.md5(req.sessionID + req.headers["user-agent"]),
  });
});

app.post("/addproduct", (req, res) => {
  const token = req.body.nonce;
  const colorValue = req.body.code;
  const qty = req.body.qty;
  const type = req.body.type;
  if (Security.isValidNonce(token, req) && qty > 0) {
    products.findOne({ codeColor: colorValue }, function (err, prod) {
      if (err) {
        if (type == "lipstick") {
          res.redirect("/lipsticks?nonExist=true");
        } else {
          res.redirect("/masks?nonExist=true");
        }
      } else {
        const cart = req.session.cart ? req.session.cart : null;
        Cart.addToCart(prod, qty, cart);
        if (type == "lipstick") {
          res.redirect("/lipsticks?cart=true");
        } else {
          res.redirect("/masks?cart=true");
        }
      }
    });
  } else {
    if (type == "lipstick") {
      res.redirect("/lipsticks");
    } else {
      res.redirect("/masks");
    }
  }
});

app.get("/masks", (req, res) => {
  const nonExist = req.query.nonExist;
  const showModal = req.query.cart;

  res.render("masks.ejs", {
    nonExist: nonExist,
    showModal: showModal,
    nonce: Security.md5(req.sessionID + req.headers["user-agent"]),
  });
});

app.get("/cart", (req, res) => {
  const userSess = req.session;
  const cart = typeof userSess.cart !== "undefined" ? userSess.cart : false;
  res.render("carts.ejs", {
    cart: cart,
    paypalClientID: process.env.PAYPAL_CLIENT_ID,

    nonce: Security.md5(req.sessionID + req.headers["user-agent"]),
  });
});
app.post("/cart/update", (req, res) => {
  const ids = req.body["product_id[]"];
  const qtys = req.body["qty[]"];
  const nonce = req.body.nonce;
  if (Security.isValidNonce(nonce, req)) {
    const cart = req.session.cart ? req.session.cart : null;
    const i = !Array.isArray(ids) ? [ids] : ids;
    const q = !Array.isArray(qtys) ? [qtys] : qtys;
    Cart.updateCart(i, q, cart);
    res.redirect("/cart");
  } else {
    res.redirect("/lipsticks");
  }
});

app.get("/cart/remove/:id/:nonce", (req, res) => {
  const id = req.params.id;
  const nonce = req.params.nonce;
  if (Security.isValidNonce(nonce, req)) {
    const message = Cart.removeFromCart(id, req.session.cart);
    if (message === "Successfully delete") {
      res.redirect("/cart");
    } else {
      res.redirect("/lipsticks");
    }
  } else {
    res.redirect("/lipsticks");
  }
});

app.get("/cart/empty/:nonce", (req, res) => {
  if (Security.isValidNonce(req.params.nonce, req)) {
    Cart.emptyCart(req);
    res.redirect("/cart");
  } else {
    res.redirect("/lipsticks");
  }
});

app.get("/checkout", (req, res) => {
  const userSession = req.session;
  const cart =
    typeof userSession.cart !== "undefined" ? userSession.cart : false;
  const message = req.query.message;
  const showModal = req.query.ordered;
  res.render("checkout", {
    pageTitle: "Checkout",
    cart: cart,
    checkoutDone: false,
    message: message,
    showModal: showModal,
    paypalClientID: process.env.PAYPAL_CLIENT_ID,
    nonce: Security.md5(req.sessionID + req.headers["user-agent"]),
  });
});

app.post("/checkout", (req, res) => {
  const nonce = req.body.nonce;

  if (Security.isValidNonce(nonce, req)) {
    const userId = req.sessionID;
    const cart = req.session.cart;
    const form = req.body;

    const order = new orders({
      userId: userId,
      items: cart.items,
      totals: cart.totals,
      firstName: form.firstname,
      lastName: form.lastname,
      email: form.email,
      address: `${form.address} , ${form.city} , ${form.zip}`,
      status: "Waiting for process",
    });

    order.save(function (err) {
      if (err) {
        res.redirect(
          "/checkout?message=There was something wrong in placing order. Please DM me to order"
        );
      }
    });

    Cart.emptyCart(req);
    res.redirect("/checkout?ordered=true");
  }
});

app.get("/tracking", (req, res) => {
  const userId = req.sessionID;
  const message = req.query.message;
  if (!message) {
    orders
      .find({ userId: userId })
      .sort({ status: -1 })
      .exec(function (err, order) {
        if (err) {
          res.redirect("/tracking?message=Cannot find your orders");
        } else {
          res.render("tracking", {
            orders: order,
          });
        }
      });
  } else {
    res.render("tracking", {
      orders: undefined,
    });
  }
});

app.get("/login", (req, res) => {
  const message = req.query.message;
  res.render("login", {
    message: req.flash("error") || message,
  });
});

app.get("/guestLogin", (req, res) => {
  passport.authenticate("local", {
    successRedirect: "/admin",
    failureRedirect: "/login",
    failureFlash: true,
  });
});
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/admin",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// admin route (login required)

app.get("/admin", auth.isAdmin, (req, res) => {
  const message = req.query.message;

  if (!message) {
    orders
      .find({})
      .sort({ status: -1 })
      .exec(function (err, order) {
        if (err) {
          res.redirect("/admin?message=Error in Database");
        } else {
          res.render("admin", {
            orders: order,
            message: undefined,
          });
        }
      });
  } else {
    res.redirect("/admin", {
      orders: undefined,
      message: message,
    });
  }
});

app.post("/order/update", (req, res) => {
  const orderId = req.body["orderId"];
  const orderStatus = req.body["orderStatus"];
  orders.findOneAndUpdate(
    { _id: orderId },
    { status: orderStatus },
    function (err) {
      if (err) {
        console.log(err);
      }
    }
  );
  res.redirect("/admin");
});

app.get("/register", auth.isAdmin, (req, res) => {
  const message = req.query.message;
  res.render("register", {
    message: message,
  });
});

app.post("/register", (req, res) => {
  const username = req.body["username"].trim().toUpperCase();
  const password = req.body["password"];
  const confirmPassword = req.body["confirmPassword"];
  if (password == confirmPassword) {
    const passwordHashed = Security.genPassword(password);
    const newAdmin = new admins({
      username: username,
      hash: passwordHashed.hash,
      salt: passwordHashed.salt,
    });

    newAdmin.save(function (err) {
      if (err) {
        res.redirect("/register?message=cannot save user");
      }
    });
    res.redirect("/login");
  }
});

app.get("/logout", auth.isAdmin, (req, res) => {
  req.logout();
  res.redirect("/login");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
