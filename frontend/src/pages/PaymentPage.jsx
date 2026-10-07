import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext, api } from "../context/AuthContext";
import "../custom-theme.css";
import { IconStar, IconCheckCircle, IconGlobe, IconWarning, IconLock } from "../components/Icons";

const PaymentPage = () => {
  const { user, updateUser, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  // currencyOverride: user can type any ISO 4217 code (e.g. "USD", "GBP")
  const [currencyOverride, setCurrencyOverride] = useState("");
  const [currencyInput, setCurrencyInput] = useState(""); // controlled input value

  // Fetch pricing — backend auto-detects currency from user IP.
  // currencyOverride lets user manually switch to any ISO 4217 code.
  useEffect(() => {
    const fetchConfig = async () => {
      setLoadingConfig(true);
      setErrorMessage("");
      try {
        const url = currencyOverride
          ? `/payment/config?currency=${currencyOverride.toUpperCase()}`
          : "/payment/config";
        const res = await api.get(url);
        setPaymentConfig(res.data);
      } catch (err) {
        console.error("Failed to load payment config:", err);
        setErrorMessage("Unable to load fee details. Please refresh or try again.");
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [currencyOverride]);

  const handleCurrencyApply = () => {
    const trimmed = currencyInput.trim().toUpperCase();
    if (trimmed.length === 3) {
      setCurrencyOverride(trimmed);
    } else if (trimmed === "") {
      setCurrencyOverride(""); // reset to auto-detected
    } else {
      setErrorMessage("Please enter a valid 3-letter currency code, e.g. USD, GBP, GHS.");
    }
  };

  // Helper to ensure Paystack script is loaded in DOM
  const loadPaystackScript = () => {
    return new Promise((resolve) => {
      if (typeof window.PaystackPop !== "undefined") {
        return resolve(true);
      }
      // Check if tag already exists
      const existing = document.querySelector('script[src*="paystack"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(true));
        existing.addEventListener("error", () => resolve(false));
        // In case it already finished loading
        setTimeout(() => resolve(typeof window.PaystackPop !== "undefined"), 1500);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle Paystack checkout
  const handleCheckout = async () => {
    if (!paymentConfig) return;
    setIsProcessing(true);
    setErrorMessage("");

    try {
      const txRef = `CBT_DIRECT_${user?._id || "USER"}_${Date.now()}`;
      const { publicKey, amount, currency } = paymentConfig;

      // Convert amount to minor currency unit (kobo/cents) for Paystack
      const amountInKobo = Math.round(Number(amount) * 100);

      // Ensure Paystack library is loaded
      await loadPaystackScript();

      // 1. If Paystack popup script is loaded and public key is configured
      if (typeof window.PaystackPop !== "undefined" && publicKey && publicKey.startsWith("pk_")) {
        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: user?.email || "student@example.com",
          amount: amountInKobo,
          currency: currency || "NGN",
          ref: txRef,
          metadata: {
            custom_fields: [
              {
                display_name: "Student Name",
                variable_name: "student_name",
                value: user?.name || "Student",
              },
              {
                display_name: "Plan",
                variable_name: "plan",
                value: "Lifetime CBT Access",
              },
            ],
          },
          callback: function (response) {
            setIsProcessing(true);
            api.post("/payment/verify", {
              reference: response.reference || txRef,
              trxref: response.trxref || txRef,
            })
              .then((verifyRes) => {
                if (verifyRes.data?.success) {
                  updateUser({ isPaid: true, paidAt: new Date() });
                  setSuccessMessage("Payment successful! You now have Lifetime Access.");
                  setTimeout(() => {
                    navigate("/dashboard");
                  }, 2000);
                } else {
                  setErrorMessage("Payment verification failed. Please contact support.");
                }
              })
              .catch((vErr) => {
                setErrorMessage(vErr.response?.data?.message || "Verification failed.");
              })
              .finally(() => {
                setIsProcessing(false);
              });
          },
          onClose: function () {
            setIsProcessing(false);
          },
        });

        handler.openIframe();
        setIsProcessing(false);
      } else {
        // 2. Development Sandbox / Mock Simulation if test key or sandbox mode
        const verifyRes = await api.post("/payment/verify", {
          reference: txRef,
          trxref: txRef,
        });

        if (verifyRes.data?.success) {
          updateUser({ isPaid: true, paidAt: new Date() });
          setSuccessMessage("Sandbox/Test verification successful! Lifetime access granted.");
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
        } else {
          setErrorMessage("Mock payment failed to register.");
        }
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setErrorMessage(err.message || "Failed to initiate payment. Please try again.");
      setIsProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="loader-container min-h-screen">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="payment-wrapper" style={{ maxWidth: "760px", margin: "2rem auto", padding: "0 1rem" }}>
      <div
        className="glass-card payment-card"
        style={{
          background: "hsl(var(--bg-secondary))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "16px",
          padding: "clamp(1.25rem, 4vw, 2.5rem)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* Back Link */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Link
            to="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "hsl(var(--text-muted))",
              fontSize: "0.95rem",
              fontWeight: "600",
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-block",
              fontSize: "2.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <IconStar size="2.5rem" color="#fbbf24" />
          </div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "var(--text-main)" }}>
            Unlock Lifetime CBT Access
          </h1>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "1.05rem", maxWidth: "540px", margin: "0 auto" }}>
            Make a one-time payment to unlock unlimited tests, detailed performance metrics, and post-exam arcade relaxation.
          </p>
        </div>

        {/* Current Status Badge */}
        {user?.isPaid ? (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#10b981",
              padding: "1rem",
              borderRadius: "12px",
              textAlign: "center",
              fontWeight: "700",
              fontSize: "1.1rem",
              marginBottom: "2rem",
            }}
          >
            <IconCheckCircle size="1.1em" color="#10b981" style={{ marginRight: "0.4rem" }} /> You already have Lifetime Access! No further payment is needed.
          </div>
        ) : (
          <div
            style={{
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "12px",
              padding: "1.2rem",
              marginBottom: "2rem",
            }}
          >
            <h3 style={{ fontSize: "1rem", color: "#d97706", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <IconWarning size="1em" color="#d97706" /> Trial Account Notice
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-main)", margin: 0, lineHeight: "1.5" }}>
              Without unlocking, assessments will be restricted by a <strong>5-minute trial cutoff</strong> that pauses your exam and prompts for payment before you can finish or record your score.
            </p>
          </div>
        )}

        {/* Auto-Detected Location & Currency Override */}
        <div
          style={{
            background: "hsl(var(--bg-tertiary))",
            padding: "1.2rem 1.5rem",
            borderRadius: "12px",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Auto-Detected Location
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", marginTop: "0.2rem" }}>
                <IconGlobe size="1em" color="currentColor" style={{ marginRight: "0.3rem" }} /> {loadingConfig ? "Detecting..." : `${paymentConfig?.countryName || "International"} — ${paymentConfig?.currency}`}
              </div>
              {paymentConfig?.ratesAvailable === false && (
                <div style={{ fontSize: "0.78rem", color: "#d97706", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <IconWarning size="0.9em" color="#d97706" /> Live rates unavailable — showing NGN default
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <label htmlFor="currency-input" style={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))", fontWeight: "600", whiteSpace: "nowrap" }}>
                Pay in another currency:
              </label>
              <input
                id="currency-input"
                type="text"
                placeholder="e.g. USD, GBP, GHS"
                maxLength={3}
                value={currencyInput}
                onChange={(e) => setCurrencyInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleCurrencyApply()}
                style={{
                  width: "110px",
                  background: "#ffffff",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  padding: "0.45rem 0.7rem",
                  color: "var(--text-main)",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              />
              <button
                onClick={handleCurrencyApply}
                style={{
                  background: "hsl(var(--primary))",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.45rem 0.9rem",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Apply
              </button>
              {currencyOverride && (
                <button
                  onClick={() => { setCurrencyOverride(""); setCurrencyInput(""); }}
                  style={{ background: "transparent", border: "none", color: "hsl(var(--text-muted))", fontSize: "0.82rem", cursor: "pointer", textDecoration: "underline" }}
                >
                  Reset to auto
                </button>
              )}
            </div>
          </div>
          <div style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "hsl(var(--text-muted))" }}>
            Supports 160+ currencies (ISO 4217). Rates are fetched live and cached hourly.
          </div>
        </div>

        {/* Price Card */}
        <div
          style={{
            border: "2px solid hsl(var(--primary))",
            borderRadius: "16px",
            padding: "2rem",
            textAlign: "center",
            background: "rgba(47, 158, 157, 0.04)",
            marginBottom: "2rem",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-12px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "hsl(var(--primary))",
              color: "#fff",
              padding: "0.2rem 1rem",
              borderRadius: "50px",
              fontSize: "0.8rem",
              fontWeight: "700",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            One-Time Payment
          </div>

          {loadingConfig ? (
            <div style={{ padding: "1.5rem", color: "hsl(var(--text-muted))" }}>Loading currency pricing...</div>
          ) : (
            <div>
              <div style={{ fontSize: "3rem", fontWeight: "800", color: "var(--text-main)", lineHeight: "1" }}>
                <span style={{ fontSize: "2rem", verticalAlign: "top", marginRight: "0.25rem" }}>
                  {paymentConfig?.currencySymbol}
                </span>
                {paymentConfig?.amount?.toLocaleString()}
                <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "hsl(var(--text-muted))", marginLeft: "0.5rem" }}>
                  {paymentConfig?.currency}
                </span>
              </div>
              <p style={{ marginTop: "0.75rem", color: "hsl(var(--text-muted))", fontSize: "0.95rem" }}>
                No subscriptions • No renewal fees • Lifetime validity
              </p>
            </div>
          )}

          {/* Benefits list */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "0.8rem",
              marginTop: "1.5rem",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-main)" }}>
              <span style={{ color: "hsl(var(--primary))", fontWeight: "bold" }}>✓</span> Unlimited CBT Practice Tests
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-main)" }}>
              <span style={{ color: "hsl(var(--primary))", fontWeight: "bold" }}>✓</span> Zero 5-minute timeout interruptions
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-main)" }}>
              <span style={{ color: "hsl(var(--primary))", fontWeight: "bold" }}>✓</span> Full Solutions & Detailed Corrections
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-main)" }}>
              <span style={{ color: "hsl(var(--primary))", fontWeight: "bold" }}>✓</span> Access to Post-Exam Arcade Zone
            </div>
          </div>
        </div>

        {/* Feedback alerts */}
        {errorMessage && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#dc2626",
              padding: "0.8rem 1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              fontWeight: "600",
              fontSize: "0.95rem",
            }}
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#059669",
              padding: "0.8rem 1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              fontWeight: "600",
              fontSize: "0.95rem",
              textAlign: "center",
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Action Button */}
        {!user?.isPaid && (
          <button
            onClick={handleCheckout}
            disabled={isProcessing || loadingConfig}
            style={{
              width: "100%",
              padding: "1rem 1.5rem",
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "1.1rem",
              fontWeight: "700",
              cursor: isProcessing || loadingConfig ? "not-allowed" : "pointer",
              boxShadow: "0 6px 20px rgba(47, 158, 157, 0.35)",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            {isProcessing ? "Processing Secure Payment..." : `Pay ${paymentConfig?.currencySymbol || ""}${paymentConfig?.amount?.toLocaleString() || ""} & Unlock Now`}
          </button>
        )}

        <div style={{ textAlign: "center", marginTop: "1.2rem", fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>
          <IconLock size="0.85em" color="hsl(var(--text-muted))" style={{ marginRight: "4px" }} /> Payments securely processed via Paystack. Supports Cards, Bank Transfer, USSD, and Mobile Money.
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
