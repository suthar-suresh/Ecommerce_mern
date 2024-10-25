const express = require("express");
const {
  checkout,
  createCheckout,
  orderStatus,
} = require("../controller/paymentController");
const router = express.Router();
const Payment = require("../models/Payment");
const User = require("../models/User");
const authUser = require("../middleware/authUser");
const dotenv = require("dotenv");
dotenv.config();

router.route("/checkout").post(checkout);
router.route("/create-checkout").post(createCheckout);
router.route("/order-status/:id").post(orderStatus);
router.route("/getkey").get((req, res) => {
  res.status(200).json({ key: process.env.STRIPE_PUBLISH_KEY });
});

router.get("/getPreviousOrders", authUser, async (req, res) => {
  try {
    const data = await Payment.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    console.log("data", data);

    res.send(data);
  } catch (error) {
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;
