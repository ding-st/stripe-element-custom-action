import React, { useEffect, useState } from "react";
import {
  PaymentElement,
  useStripe,
  LinkAuthenticationElement,
  useElements,
} from "@stripe/react-stripe-js";

export default function CheckoutForm({ clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "setup_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrieveSetupIntent(clientSecret).then(({ setupIntent }) => {
      switch (setupIntent.status) {
        case "succeeded":
          setMessage("setupIntent succeeded!");
          break;
        case "processing":
          setMessage("Your setupIntent is processing.");
          break;
        case "requires_payment_method":
          setMessage("Your setupIntent was not successful, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    // await stripe.retrieveSetupIntent(clientSecret).then(({ setupIntent }) => {
    //   fetch("/update-setupIntent", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ setupIntent: setupIntent.id }),
    //   }).then((res) => res.json());
    // });

    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: "http://localhost:3000",
      },
      redirect: "if_required",
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error) {
      // This point will only be reached if there is an immediate error when
      // confirming the payment. Show error to your customer (for example, payment
      // details incomplete)
      setMessage(error.message);
    } else {
      // Your customer will be redirected to your `return_url`. For some payment
      // methods like iDEAL, your customer will be redirected to an intermediate
      // site first to authorize the payment, then redirected to the `return_url`.
    }

    setIsLoading(false);
  };
  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      {/* <LinkAuthenticationElement
      // Optional prop for prefilling customer information
      // options={{
      //   defaultValues: {
      //     email: "foo@bar.com",
      //   },
      // }}
      /> */}
      <PaymentElement
        id="payment-element"
        options={{
          defaultValues: {
            billingDetails: {
              email: "foo@bar.com",
              name: "John Doe",
              phone: "888-888-8888",
            },
          },
        }}
      />
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
