import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function Checkout({ cart }) {
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pollingMessage, setPollingMessage] = useState("");
  const [pollingActive, setPollingActive] = useState(false);
  const pollingController = useRef({ cancel: false });
  const totalPrice = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  // Check if returning from GCash redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentId = urlParams.get("payment_intent");

    if (paymentIntentId) {
      console.log("Returned from GCash redirect. PaymentIntentId:", paymentIntentId);
      startPolling(paymentIntentId);

      // Clean URL query parameters
      window.history.replaceState({}, document.title, "/checkout");
    }
  }, []);

  const handleGCashPayment = async () => {
    setProcessing(true);
    try {
      const res = await fetch("https://server-1-qq50.onrender.com/api/create-gcash-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart }),
      });

      const { paymentIntentId, redirectUrl } = await res.json();
      console.log("PaymentIntentId:", paymentIntentId);
      console.log("Redirecting user to GCash checkout:", redirectUrl);

      if (!paymentIntentId || !redirectUrl) {
        console.error("Failed to create GCash payment.");
        setProcessing(false);
        return;
      }

      window.location.href = redirectUrl;
    } catch (err) {
      console.error("GCash payment error:", err);
      setProcessing(false);
    }
  };

  const startPolling = async (paymentIntentId) => {
    pollingController.current.cancel = false;
    setPollingActive(true);
    setProcessing(true);
    setPollingMessage("Waiting for payment confirmation...");

    try {
      const timeout = Date.now() + 5 * 60 * 1000; // 5 minutes max
      let completed = false;

      while (!completed && Date.now() < timeout && !pollingController.current.cancel) {
        const res = await fetch("https://server-1-qq50.onrender.com/api/confirm-gcash-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId, cart }),
        });

        const data = await res.json();
        console.log("Polling response:", data);

        if (data.success) {
          setOrderPlaced(true);
          completed = true;
          break;
        } else {
          setPollingMessage(`Payment not completed yet (${data.status || "awaiting"}), retrying...`);
        }

        await new Promise((r) => setTimeout(r, 3000));
      }

      if (!completed && !pollingController.current.cancel) {
        setPollingMessage("Payment not completed (timeout). Please try again.");
      }
    } catch (err) {
      console.error("Error polling payment:", err);
      setPollingMessage("Error confirming payment. Please try again.");
    } finally {
      setPollingActive(false);
      setProcessing(false);
    }
  };

  const cancelPolling = () => {
    pollingController.current.cancel = true;
    setPollingMessage("Polling canceled by user.");
    setPollingActive(false);
    setProcessing(false);
  };

  if (orderPlaced) {
    return (
      <div className="container mt-5">
        <div className="card shadow-sm p-4">
          <h2>Order Confirmation</h2>
          <p>Thank you for your purchase!</p>
          <ul className="list-group mb-3">
            {cart.map((item) => (
              <li key={item.barcode} className="list-group-item d-flex justify-content-between">
                {item.name} (x{item.quantity}) <span>₱{Number(item.price) * item.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="fw-bold">Total: ₱{totalPrice}</p>
          <p>Payment Method: GCash</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="card shadow-sm p-4">
        <h2 className="mb-4">Checkout</h2>
        <ul className="list-group mb-3">
          {cart.map((item) => (
            <li key={item.barcode} className="list-group-item d-flex justify-content-between">
              {item.name} (x{item.quantity}) <span>₱{Number(item.price) * item.quantity}</span>
            </li>
          ))}
        </ul>
        <p className="fw-bold">Total: ₱{totalPrice}</p>
        <button
          onClick={handleGCashPayment}
          className="btn btn-success me-2"
          disabled={processing || pollingActive}
        >
          {processing ? "Processing..." : "Pay with GCash"}
        </button>
        {pollingActive && (
          <button onClick={cancelPolling} className="btn btn-danger">
            Cancel Payment
          </button>
        )}
        {pollingMessage && <p className="mt-3 text-info">{pollingMessage}</p>}
      </div>
    </div>
  );
}

export default Checkout;
