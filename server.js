require("dotenv").config();
const express = require("express");
const app = express();
// This is your test secret API key.
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use(express.static("public"));
app.use(express.json());

const calculateOrderAmount = (items) => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  return 1400;
};

app.post("/create-payment-intent", async (req, res) => {
  // Create a PaymentIntent with the order amount and currency
  const setupIntent = await stripe.setupIntents.create({
    payment_method_types: ["card"],
    customer: "cus_MdRanwMR9V7GOg",
    usage: "off_session",
  });

  res.send({
    clientSecret: setupIntent.client_secret,
  });
});
app.post("/update-customer", async (req, res) => {
  const { pm } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const customer = await await stripe.customers.update("cus_MamPMT090rmIdj", {
    invoice_settings: {
      default_payment_method: pm,
    },
  });

  res.send({
    clientSecret: customer.id,
  });
});
app.post("/update-setupIntent", async (req, res) => {
  const { setupIntent } = req.body;
  console.log(setupIntent);
  // Create a PaymentIntent with the order amount and currency
  const customer = await stripe.setupIntents.update(setupIntent, {
    metadata: {
      default_payment_method: "true",
    },
  });

  res.send({
    clientSecret: customer.id,
  });
});

app.post("/confirmPayment", async (req, res) => {
  const { payment_intent_id } = req.body;
  console.log(payment_intent_id);
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.retrieve(
    payment_intent_id,
    { expand: ["payment_method"] }
  );

  if (paymentIntent.payment_method.card.brand === "visa") {
    await stripe.paymentIntents.confirm(payment_intent_id, {
      return_url:
        "https://stripe.com/docs/payments/run-custom-actions-before-confirmation#payment-method-details",
      application_fee_amount: 100,
    });
  } else if (paymentIntent.payment_method.card.brand === "mastercard") {
    await stripe.paymentIntents.confirm(payment_intent_id, {
      return_url:
        "https://stripe.com/docs/payments/run-custom-actions-before-confirmation#payment-method-details",
      application_fee_amount: 150,
    });
  } else {
    await stripe.paymentIntents.confirm(payment_intent_id, {
      return_url:
        "https://stripe.com/docs/payments/run-custom-actions-before-confirmation#payment-method-details",
      application_fee_amount: 300,
    });
  }

  // await stripe.paymentIntents.confirm(payment_intent_id, {
  //   return_url:
  //     "https://stripe.com/docs/payments/run-custom-actions-before-confirmation#payment-method-details",
  // });

  res.send({
    clientSecret: paymentIntent.client_secret,
    payment_intent_id: payment_intent_id,
  });
});

app.listen(4242, () => console.log("Node server listening on port 4242!"));
