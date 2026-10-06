import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// ──────────────────────────────────────────────────────────────────────────────
// Exchange rate cache — refresh at most once per hour so we don't spam the API
// ──────────────────────────────────────────────────────────────────────────────
let rateCache = { rates: null, fetchedAt: 0 };
const RATE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getNGNRates() {
  const now = Date.now();
  if (rateCache.rates && now - rateCache.fetchedAt < RATE_TTL_MS) {
    return rateCache.rates; // return cached
  }
  try {
    // open.er-api.com — completely free, no API key, covers 160+ currencies
    const res = await fetch("https://open.er-api.com/v6/latest/NGN");
    const data = await res.json();
    if (data.result === "success" && data.rates) {
      rateCache = { rates: data.rates, fetchedAt: now };
      return data.rates;
    }
  } catch (err) {
    console.warn("[Payment] Exchange rate fetch failed, using cached/fallback:", err.message);
  }
  // Return last known cache even if stale, or null
  return rateCache.rates;
}

// Currency symbol map — covers virtually every currency code
const CURRENCY_SYMBOLS = {
  NGN: "₦", USD: "$", GBP: "£", EUR: "€", GHS: "GH₵", KES: "KSh",
  ZAR: "R", UGX: "USh", TZS: "TSh", RWF: "FRw", CAD: "CA$", AUD: "A$",
  CNY: "¥", JPY: "¥", INR: "₹", BRL: "R$", MXN: "MX$", EGP: "E£",
  AED: "د.إ", SAR: "﷼", PKR: "₨", BDT: "৳", PHP: "₱", IDR: "Rp",
  THB: "฿", MYR: "RM", SGD: "S$", HKD: "HK$", NZD: "NZ$", CHF: "Fr",
  SEK: "kr", NOK: "kr", DKK: "kr", ZMW: "ZK", ETB: "Br", XOF: "CFA",
  XAF: "CFA", MAD: "د.م.", TND: "د.ت", DZD: "دج", SEN: "CFA",
};

// Round amount to sensible precision per currency
function roundAmount(amount, currency) {
  // Zero-decimal currencies (whole numbers only)
  const zeroDecimal = ["JPY", "KRW", "UGX", "RWF", "TZS", "VND", "XOF", "XAF", "CLP", "ISK"];
  if (zeroDecimal.includes(currency)) return Math.round(amount);
  // Tiny value currencies — round to nearest 5
  if (amount > 1000) return Math.round(amount / 5) * 5;
  if (amount > 100) return Math.round(amount);
  if (amount >= 10) return Math.round(amount * 10) / 10;
  return Math.round(amount * 100) / 100;
}

/**
 * GET /api/payment/config
 * Auto-detects user's currency from their IP, converts NGN base price,
 * and returns localized pricing. Supports every world currency via live exchange rates.
 * Optional query params: ?currency=USD or ?country=US to override.
 */
router.get("/config", async (req, res) => {
  const BASE_NGN = Number(process.env.TEST_FEE_AMOUNT) || 3000;
  const overrideCurrency = (req.query.currency || "").toUpperCase();
  const overrideCountry = (req.query.country || "").toUpperCase();

  let targetCurrency = overrideCurrency || null;
  let countryName = "International";
  let countryCode = overrideCountry || null;

  // Step 1: If no manual override, detect currency from client IP via ip-api.com
  if (!targetCurrency) {
    try {
      // Extract real client IP (handles proxies/Nginx)
      const clientIp =
        req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
        req.headers["x-real-ip"] ||
        req.socket?.remoteAddress ||
        "";

      // Skip localhost/private IPs
      const isPrivate = /^(127\.|10\.|192\.168\.|::1|localhost)/i.test(clientIp);

      if (!isPrivate && clientIp) {
        // ip-api.com — free (no key), returns country + currency
        const geoRes = await fetch(`http://ip-api.com/json/${clientIp}?fields=country,currency,countryCode`, {
          signal: AbortSignal.timeout(3000),
        });
        const geo = await geoRes.json();
        if (geo.currency) {
          targetCurrency = geo.currency.toUpperCase();
          countryName = geo.country || countryName;
          countryCode = geo.countryCode || null;
        }
      }
    } catch (geoErr) {
      console.warn("[Payment] IP geolocation failed:", geoErr.message);
    }
  }

  // Fallback: use env default
  if (!targetCurrency) {
    targetCurrency = (process.env.TEST_FEE_CURRENCY || "NGN").toUpperCase();
  }

  // Step 2: Fetch live exchange rates from NGN → all currencies
  let finalAmount = BASE_NGN;
  let rates = null;

  if (targetCurrency !== "NGN") {
    rates = await getNGNRates();
    if (rates && rates[targetCurrency]) {
      const rawConverted = BASE_NGN * rates[targetCurrency];
      finalAmount = roundAmount(rawConverted, targetCurrency);
    } else {
      // Rate not found — fall back to NGN
      targetCurrency = "NGN";
      finalAmount = BASE_NGN;
    }
  }

  const symbol = CURRENCY_SYMBOLS[targetCurrency] || targetCurrency;

  res.json({
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || "pk_test_sandbox_key",
    amount: finalAmount,
    currency: targetCurrency,
    currencySymbol: symbol,
    countryName,
    countryCode,
    baseNGN: BASE_NGN,
    ratesAvailable: Boolean(rates),
    title: "Lifetime Full CBT Exam Access",
    description: "One-time payment unlocking unlimited CBT tests and evaluations permanently.",
  });
});

/**
 * GET /api/payment/status
 * Returns the current authenticated user's payment status
 */
router.get("/status", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("isPaid paidAt paymentReference");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      isPaid: Boolean(user.isPaid),
      paidAt: user.paidAt,
      paymentReference: user.paymentReference,
    });
  } catch (error) {
    console.error("Payment status error:", error);
    res.status(500).json({ message: "Failed to fetch payment status" });
  }
});

/**
 * POST /api/payment/verify
 * Verifies transaction with Paystack and marks user as paid
 */
router.post("/verify", authenticateToken, async (req, res) => {
  try {
    const { reference, trxref } = req.body;
    const ref = reference || trxref;

    if (!ref) {
      return res.status(400).json({ message: "Transaction reference is required." });
    }

    const secretKey = (process.env.PAYSTACK_SECRET_KEY || "").trim();

    let isSuccess = false;

    if (secretKey && secretKey.startsWith("sk_")) {
      try {
        // Direct verification call to Paystack API
        const verifyEndpoint = `https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`;
        const response = await fetch(verifyEndpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (data.status === true && data.data && data.data.status === "success") {
          isSuccess = true;
        } else {
          return res.status(400).json({
            message: "Transaction could not be verified with Paystack.",
            details: data.message || "Unsuccessful status from Paystack.",
          });
        }
      } catch (psErr) {
        console.error("Paystack API verification error:", psErr);
        return res.status(502).json({ message: "Could not reach Paystack payment gateway." });
      }
    } else {
      // In sandbox/development test mode without live keys:
      console.log(`[Payment Debug] Verified transaction reference ${ref} in Paystack sandbox/mock mode.`);
      isSuccess = true;
    }

    if (isSuccess) {
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          isPaid: true,
          paidAt: new Date(),
          paymentReference: String(ref),
        },
        { new: true }
      ).select("-password");

      return res.json({
        success: true,
        message: "Payment verified successfully! Lifetime access unlocked.",
        user: updatedUser,
      });
    }

    return res.status(400).json({ message: "Payment verification failed." });
  } catch (error) {
    console.error("Payment verification route error:", error);
    res.status(500).json({ message: "Internal server error during verification." });
  }
});

export default router;
