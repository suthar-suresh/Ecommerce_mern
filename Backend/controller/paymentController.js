const dotenv = require("dotenv");
dotenv.config();
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Cart = require("../models/Cart");
const nodemailer = require("nodemailer");
const stripes = require("stripe");

const stripe = stripes("sk_test_i5Gc2AmQWWDBTOyxgPJsLNNe", {
  apiVersion: "2020-08-27",
});
var Paymentcount;
var PaymentMethodId;
let userInfo;
let productInfo = {};
let totalAmount;
let userData = {};

const checkout = async (req, res) => {
  try {
    const { amount, userId, productDetails, userDetails } = req.body;
    totalAmount = Number(amount);
    userInfo = userId;
    productInfo = JSON.parse(productDetails);
    userData = JSON.parse(userDetails);

    const options = {
      amount: Number(amount * 100),
      currency: "INR",
    };
    // const order = await instance.orders.create(options);

    res.status(200).json({
      success: true,
      // order,
    });
  } catch (error) {
    console.log(error);
  }
};
const createCheckout = async (req, res) => {
  try {
    const { amount } = req.body;
    console.log("amount", amount);

    const paymentCount = await Payment.countDocuments();
    console.log("previous", paymentCount);
    // amount = amount * 100;
    // const amount = 500;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Payment",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:3000/paymentsuccess`,
      cancel_url: "http://localhost:3000/checkout",
    });

    res.json({ id: session.id, previousCount: paymentCount });
  } catch (error) {
    res.json(error);
  }
};
const handlePaymentSuccess = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Error verifying webhook signature:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.created":
      const createdPaymentIntent = event.data.object;
      const createdPaymentId = createdPaymentIntent.id;
      const createdAmount = createdPaymentIntent.amount / 100;
      const createdCurrency = createdPaymentIntent.currency;
      const createdCustomerId = createdPaymentIntent.customer;
      const intendStatus = "Pending";

      const createdPaymentRecord = {
        paymentId: createdPaymentId,
        amount: createdAmount,
        currency: createdCurrency,
        customerId: createdCustomerId,
        status: intendStatus,
        user: userInfo,
        productData: productInfo,
        userData,
        totalAmount,
        orderStatus: "pending",
      };
      PaymentMethodId = createdPaymentId;
      const setPayments = await Payment.create(createdPaymentRecord);

      console.log("PaymentMethodId", PaymentMethodId);
      console.log("from payment intendtype", event.type);
      console.log("Payment Intent Created ID:", createdPaymentRecord);
      break;

    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      const succeededPaymentId = paymentIntent.id;
      const succeededAmount = paymentIntent.amount / 100;
      const succeededCurrency = paymentIntent.currency;
      const succeededCustomerId = paymentIntent.customer;

      const succeededPaymentRecord = {
        paymentId: succeededPaymentId,
        amount: succeededAmount,
        currency: succeededCurrency,
        customerId: succeededCustomerId,
      };
      console.log("from payment Success", event.type);
      const setPayment = await Payment.updateOne(
        { paymentId: PaymentMethodId },
        { $set: { status: "Payment_Success", customerId: succeededCustomerId } }
      );
      try {
        // Database comes here`
        const transport = nodemailer.createTransport({
          service: "gmail",
          host: "smtp.gmail.email",
          port: 465,
          auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
          },
        });
        console.log("userEmail", userData.userEmail);

        const mailOptions = {
          from: process.env.EMAIL,
          to: userData.userEmail,
          subject: "Order Confirm",
          html: `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Order Confirmation</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                font-size: 16px;
                line-height: 1.5;
                color: black;
              }
        
              h1 {
                font-size: 24px;
                margin-bottom: 20px;
                color: black;
              }
        
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
        
              th {
                text-align: left;
                padding: 10px;
                background-color: #eee;
              }
        
              td {
                padding: 10px;
                border: 1px solid #ddd;
              }
        
              .address {
                margin-bottom: 20px;
                color: black;

              }
        
              .address h2 {
                font-size: 20px;
                margin-bottom: 10px;
              }
        
              .address p {
                margin: 0;
              }
        
              .thanks {
                font-size: 18px;
                margin-top: 20px;
                color: black;

              }
        
              .signature {
                margin-top: 40px;
                color: black;

              }
        
              .signature p {
                margin: 0;
              }
            </style>
          </head>
          <body>
            <h1>Order Confirmation</h1>
            <p style="color:black;">Dear <b>${userData.firstName} ${
            userData.lastName
          }</b>,</p>
            <p>Thank you for your recent purchase on our website. We have received your payment of <b>₹${totalAmount}</b> and have processed your order.</p>
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${productInfo
                  .map((product) => {
                    return `
                            <tr>
                              <td>${product.productId.name}</td>
                              <td>${product.quantity}</td>
                              <td>₹${product.productId.price}</td>
                            </tr>
                          `;
                  })
                  .join("")}
          <tr>
          <td>Shipping Charge</td>
          <td></td>
          <td>₹100</td>
        </tr>
        <tr>
          <td>Total</td>
          <td></td>
          <td>₹${totalAmount}</td>
        </tr>
              </tbody >
            </table >
            <div class="address">
              <h2>Shipping Address</h2>
              <p>${userData.firstName} ${userData.lastName}</p>
              <p>${userData.address}</p>
              <p>${userData.city}-${userData.zipCode}</p>
              <p>${userData.userState}</p>
            </div>
            <p class="thanks">Thank you for choosing our website. If you have any questions or concerns, please don't hesitate to contact us.</p>
            <div class="signature">
              <p>Best regards,</p>
              <p> <a href="https://e-shopit.vercel.app/" target="_blank">ShopIt.com</a></p>
            </div>
          </body >
        </html >
  `,
          text: `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Order Confirmation</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                font-size: 16px;
                line-height: 1.5;
                color: black;
              }
        
              h1 {
                font-size: 24px;
                margin-bottom: 20px;
                color: black;
              }
        
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
        
              th {
                text-align: left;
                padding: 10px;
                background-color: #eee;
              }
        
              td {
                padding: 10px;
                border: 1px solid #ddd;
              }
        
              .address {
                margin-bottom: 20px;
                color: black;

              }
        
              .address h2 {
                font-size: 20px;
                margin-bottom: 10px;
              }
        
              .address p {
                margin: 0;
              }
        
              .thanks {
                font-size: 18px;
                margin-top: 20px;
                color: black;

              }
        
              .signature {
                margin-top: 40px;
                color: black;

              }
        
              .signature p {
                margin: 0;
              }
            </style>
          </head>
          <body>
            <h1>Order Confirmation</h1>
            <p style="color:black;">Dear <b>${userData.firstName} ${
            userData.lastName
          }</b>,</p>
            <p>Thank you for your recent purchase on our website. We have received your payment of <b>₹${totalAmount}</b> and have processed your order.</p>
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${productInfo
                  .map((product) => {
                    return `
                            <tr>
                              <td>${product.productId.name}</td>
                              <td>${product.quantity}</td>
                              <td>₹${product.productId.price}</td>
                            </tr>
                          `;
                  })
                  .join("")}
          <tr>
          <td>Shipping Charge</td>
          <td></td>
          <td>₹100</td>
        </tr>
        <tr>
          <td>Total</td>
          <td></td>
          <td>₹${totalAmount}</td>
        </tr>
              </tbody >
            </table >
            <div class="address">
              <h2>Shipping Address</h2>
              <p>${userData.firstName} ${userData.lastName}</p>
              <p>${userData.address}</p>
              <p>${userData.city}-${userData.zipCode}</p>
              <p>${userData.userState}</p>
            </div>
            <p class="thanks">Thank you for choosing our website. If you have any questions or concerns, please don't hesitate to contact us.</p>
            <div class="signature">
              <p>Best regards,</p>
              <p> <a href="https://e-shopit.vercel.app/" target="_blank">ShopIt.com</a></p>
            </div>
          </body >
        </html >
  `,
        };

        transport.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            // res.send({ msg: error });
          } else {
            return res.send({ success, msg: "Order Confirm" });
          }
        });
        await Payment.updateOne(
          { paymentId: PaymentMethodId },
          {
            user: userInfo,
            productData: productInfo,
            userData,
            totalAmount,
          }
        );
        const deleteCart = await Cart.deleteMany({ user: userInfo });
      } catch (error) {
        console.log(error);
      }

      console.log("Payment Succeeded ID:", succeededPaymentRecord);
      break;

    case "checkout.session.completed":
      const session = event.data.object;
      const paymentId = session.payment_intent;
      const amount = session.amount_total / 100;
      const email = session.customer_details.email;

      const paymentRecord = {
        paymentId: paymentId,
        amount: amount,
        email: email,
      };

      console.log("From checkout_session_completed", event.type);

      break;
    case "payment_intent.payment_failed":
      const failedPaymentIntent = event.data.object;
      const failedPaymentId = failedPaymentIntent.id;
      const failedAmount = failedPaymentIntent.amount / 100;
      const failedCurrency = failedPaymentIntent.currency;
      const failedCustomerId = failedPaymentIntent.customer;

      const failedPaymentRecord = {
        paymentId: failedPaymentId,
        amount: failedAmount,
        currency: failedCurrency,
        customerId: failedCustomerId,
      };

      const setFailed = await Payment.updateOne(
        { paymentId: PaymentMethodId },
        { $set: { status: "Payment_Failed", customerId: failedCustomerId } }
      );
      console.log("from payment intend Failed", event.type);
      console.log("Payment Intent Failed ID:", setFailed);
      break;

    default:
      Paymentcount = event.type;
      console.log("from default event type", event.type);
      console.warn(`Unhandled event type: ${event.type}`);
      console.log("paymentcount", Paymentcount);
  }

  res.json({ received: true });
};

const orderStatus = async (req, res) => {
  const id = req.params.id;
  try {
    const orderStatusApproved = await Payment.updateOne(
      { _id: id },
      { orderStatus: "Approved" }
    );
    res.json({ msg: "Order Approved by Admin" });
  } catch (error) {
    res.send(error);
  }
};

module.exports = {
  checkout,
  createCheckout,
  handlePaymentSuccess,
  orderStatus,
};
