const items = [];
let total = 0;

const getData = async () => {
  productId = document.querySelectorAll(".productId");

  qty = document.querySelectorAll(".qty");

  price = document.querySelectorAll(".price");

  await productId.forEach((product, i) => {
    total += Number(price[i].value) * Number(qty[i].value);
    const item = {
      id: product.value,
      quantity: Number(qty[i].value),
      price: Number(price[i].value),
    };
    items.push(item);
  });
};
getData().then(() => {
  paypal
    .Buttons({
      // Sets up the transaction when a payment button is clicked
      createOrder: function (data, actions) {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: `${total}`, // Can reference variables or functions. Example: `value: document.getElementById('...').value`
              },

              // items: items,
            },
          ],
        });
      },

      // Finalize the transaction after payer approval
      onApprove: function (data, actions) {
        return actions.order.capture().then(function (orderData) {
          // Successful capture! For dev/demo purposes:
          console.log(
            "Capture result",
            orderData,
            JSON.stringify(orderData, null, 2)
          );

          // detail of the transaction;
          var transaction = orderData.purchase_units[0].payments.captures[0];

          const form = document.querySelector(".checkoutForm");
          form.submit();
        });
      },
    })
    .render("#paypal-button-container");
});
