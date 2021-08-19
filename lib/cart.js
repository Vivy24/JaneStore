const config=require('./config')

class Cart {
    static setFormattedTotals(cart){
        const format=new Intl.NumberFormat(config.locale.lang, {style:'currency',currency: config.locale.currency});
        const totals=cart.totals;
        cart.formattedTotals=format.format(totals)
    }

    static calculateTotals(cart){
        cart.totals=0.00;
        cart.items.forEach(item=>{
            const price=item.price;
            const qty=item.qty;
            const amount=price*qty;
        
            cart.totals+=amount;
        });
        this.setFormattedTotals(cart);
    }
    static inCart(productID=0,cart){
        let found=false;
        cart.items.forEach(item=>{
            if(item.id===productID){
                found=true
            }
        })
        return found;
    }

    static addToCart(product,qty,cart){
        if(!this.inCart(product._id,cart)){
            const format=new Intl.NumberFormat(config.locale.lang, {style:'currency',currency: config.locale.currency});
            const prod= {
                id:product._id,
                title:product.title,
                price:product.price,
                qty: qty,
                image: product.image,
                formattedPrice:format.format(product.price)
            };
            cart.items.push(prod)
            this.calculateTotals(cart);
        }
    }
    
}

module.exports= Cart;