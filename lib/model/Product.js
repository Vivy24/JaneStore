const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ProductsSchema = new Schema({
  product_id: Number,
  codeColor: Number,
  title: String,
  price: Number,
  image: String,
});

module.exports = mongoose.model("Products", ProductsSchema, "products");
