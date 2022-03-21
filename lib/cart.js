const config = require("./config");

class Cart {
  static setFormattedTotals(cart) {
    const format = new Intl.NumberFormat(config.locale.lang, {
      style: "currency",
      currency: config.locale.currency,
    });
    const totals = cart.totals;
    cart.formattedTotals = format.format(totals);
  }

  static calculateTotals(cart) {
    cart.totals = 0.0;
    cart.items.forEach((item) => {
      const price = item.price;
      const qty = item.qty;
      const amount = price * qty;

      cart.totals += amount;
    });
    this.setFormattedTotals(cart);
  }
  static inCart(productID = 0, cart) {
    let found = false;
    cart.items.forEach((item) => {
      if (item.id === productID) {
        found = true;
      }
    });
    return found;
  }

  static addToCart(product, qty, cart) {
    if (!this.inCart(product._id, cart)) {
      const format = new Intl.NumberFormat(config.locale.lang, {
        style: "currency",
        currency: config.locale.currency,
      });
      const prod = {
        id: product._id,
        title: product.title,
        price: product.price,
        qty: qty,
        image: product.image,
        formattedPrice: format.format(product.price),
      };
      cart.items.push(prod);
      this.calculateTotals(cart);
    }
  }

  static removeFromCart(id = 0, cart) {
    for (let i = 0; i < cart.items.length; i++) {
      let item = cart.items[i];
      if (item.id.toString() === id) {
        cart.items.splice(i, 1);
        this.calculateTotals(cart);
        return "Successfully delete";
      }
    }
    return "Does not have this items";
  }

  static updateCart(ids = [], qtys = [], cart) {
    const map = [];
    let updated = false;

    ids.forEach((id, i) => (map[id] = qtys[i]));

    ids.forEach((id) => {
      cart.items.forEach((item) => {
        if (item.id.toString() === id) {
          if (map[id] > 0 && map[id] !== item.qty) {
            item.qty = map[id];
            return;
          }
        }
      });
    });
    updated = true;
    if (updated) {
      this.calculateTotals(cart);
      return "Successfully updated";
    }
  }

  static emptyCart(request) {
    if (request.session) {
      request.session.cart.items = [];
      request.session.cart.totals = 0.0;
      request.session.cart.formattedTotals = "";
    }
  }
}

module.exports = Cart;
