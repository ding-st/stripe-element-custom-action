import React, { useEffect, useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  var stripePaymentMethodHandler = async function (result) {
    if (result.error) {
      // Show error in payment form
    } else {
      // Otherwise send paymentIntent.id to your server
      await fetch("/confirmPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_intent_id: result.paymentIntent.id,
        }),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (paymentResponse) {
          // Handle server response (see Step 7)
          handleServerResponse(paymentResponse);
        });
    }
  };

  var handleServerResponse = async function (response) {
    if (response.error) {
      setMessage(response.error.message);
    } else if (response.requires_action) {
      // Use Stripe.js to handle the required next action
      var result = stripe
        .handleNextAction({
          clientSecret: response.payment_intent_client_secret,
        })
        .then(function (result) {
          if (result.error) {
            setMessage(result.error.message);
          } else {
            setMessage("Payment succeeded!");
          }
        });
    } else {
      setMessage("Payment succeeded!");
    }
  };

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (event) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }
    setIsLoading(true);
    const result = await stripe.updatePaymentIntent({
      elements,
      // params: {
      //   payment_method_data: {
      //     billing_details: { ... }
      //   },
      //   shipping: { ... }
      // }
    });

    await stripePaymentMethodHandler(result);
    setIsLoading(false);
  };
  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" />
      <button disabled={isLoading || !stripe || !elements} id="submit">
        <span id="button-text">
          {isLoading ? <div className="spinner" id="spinner"></div> : "Pay now"}
        </span>
      </button>
      {/* Show any error or success messages */}
      {message && <div id="payment-message">{message}</div>}
    </form>
  );
}
