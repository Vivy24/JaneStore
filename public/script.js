const items=[];

productId=document.querySelectorAll(".id");
qty=document.querySelectorAll(".qty");
price=document.querySelectorAll(".price");
productId.forEach((product,i)=>{
    const item={
        id:product.value, 
        quantity:Number(qty[i].value),
        price:Number(price[i].value),
    }
    items.push(item);
})

console.log(items)


// paypal.Buttons({
//     createOrder:function(data,actions){
//         return fetch("/create-order", {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//               items:items
//           }),
//         })
//           .then(res => {
//             if (res.ok) return res.json()
//             return res.json().then(json => Promise.reject(json))
//           })
//           .then(({ id }) => {
//             return id
//           })
//           .catch(e => {
//             console.error(e.error)
//           })
//     },
//     onApprove:function(data,actions){
//         return actions.order.capture();
//     }
// }).render("#paypal");

paypal
  .Buttons({
    createOrder: function () {
      return fetch("/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items,
        }),
      })
        .then(res => {
          if (res.ok) return res.json()
          return res.json().then(json => Promise.reject(json))
        })
        .then(({ id }) => {
          return id
        })
        .catch(e => {
          console.error(e.error)
        })
    },
    onApprove: function (data, actions) {
      return actions.order.capture()
    },
  })
  .render("#paypal")