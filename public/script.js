const items = [];
let total = 0;

const getData = async () => {
  productId = document.querySelectorAll(".productId");
  console.log(productId);

  qty = document.querySelectorAll(".qty");

  console.log(qty);
  price = document.querySelectorAll(".price");

  console.log(price);

  await productId.forEach((product, i) => {
    total += Number(price[i].value);
    const item = {
      id: product.value,
      quantity: Number(qty[i].value),
      price: Number(price[i].value),
    };
    items.push(item);
  });
};
getData().then(() => {
  console.log(items);
  console.log(total);

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
          var transaction = orderData.purchase_units[0].payments.captures[0];
          alert(
            "Transaction " +
              transaction.status +
              ": " +
              transaction.id +
              "\n\nSee console for all available details"
          );

          // When ready to go live, remove the alert and show a success message within this page. For example:
          // var element = document.getElementById('paypal-button-container');
          // element.innerHTML = '';
          // element.innerHTML = '<h3>Thank you for your payment!</h3>';
          // Or go to another URL:  actions.redirect('thank_you.html');
        });
      },
    })
    .render("#paypal-button-container");
});

//  paypal.Buttons({
//      createOrder: function(data,actions){
//          return actions.order.create({
//            purchase_units: items
//          })},

//          onApprove: function(data, actions){
//            return actions.order.capture().then(function(orderData){
// console.log('Capture result', orderData, JSON.stringify(orderData, null, 2));
//            })
//            var transaction = orderData.purchase_units[0].payments.captures[0];
//                 alert('Transaction '+ transaction.status + ': ' + transaction.id + '\n\nSee console for all available details');

//             // When ready to go live, remove the alert and show a success message within this page. For example:
//             // var element = document.getElementById('paypal-button-container');
//             // element.innerHTML = '';
//             // element.innerHTML = '<h3>Thank you for your payment!</h3>';
//             // Or go to another URL:  actions.redirect('thank_you.html');
//           });
//         }
//       }).render('#paypal-button-container');

//paypal
//   .Buttons({
//     createOrder: function () {
//       return fetch("/create-order", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           items: items,
//         }),
//       })
//         .then((res) => {
//           console.log("This is res", res);
//           if (res.ok) return res.json();
//           return res.json().then((json) => Promise.reject(json));
//         })
//         .then(({ id }) => {
//           console.log({ id });
//           return id;
//         })
//         .catch((e) => {
//           console.error(e.error);
//         });
//     },
//     onApprove: function (data, actions) {
//       console.log({ data });
//       return actions.order.capture();
//     },
//   })
//   .render("#paypal");
