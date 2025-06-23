import stripe from "stripe";

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

export default stripeClient;

const createPaymentLink = async (amount, currency = 'usd') => {
    try{
        const session = await stripeClient.checkout.sessions.create({
            line_items: [{
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: 'T-shirt',
                  },
                  unit_amount: 2000,
                },
                quantity: 1,
              }],
            mode: 'payment',
            ui_mode: 'embedded',
            return_url: 'https://example.com/checkout/return?session_id={CHECKOUT_SESSION_ID}'  
        })
    }
    catch(error){
        console.log(error)
    }
}