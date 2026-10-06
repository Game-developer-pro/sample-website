import React from "react";
import ReactDOM from "react-dom/client";
import App from "./Apps"; // or "./Apps"
import { AuthProvider } from "./context/AuthContext";
import "./index.css"; // global CSS
import "./custom-theme.css"; // design tokens & theme overrides

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

// Register service worker for offline caching and fast loads on slow networks
if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("ServiceWorker active:", reg.scope);
      })
      .catch((err) => {
        console.warn("ServiceWorker registration failed:", err);
      });
  });
}
