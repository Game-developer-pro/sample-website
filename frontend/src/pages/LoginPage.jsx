import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.1 0 5.8 1.1 8 2.9l6-6C34.5 3.2 29.6 1 24 1 14.8 1 7 6.7 3.7 14.6l7 5.4C12.4 13.5 17.7 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9C43.4 37.3 46.5 31.4 46.5 24.5z"/>
    <path fill="#FBBC05" d="M10.7 28.6A14.4 14.4 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6L3.3 14c-1.4 2.8-2.3 6-2.3 10s.8 7.1 2.3 10l7.4-5.4z"/>
    <path fill="#34A853" d="M24 47c5.6 0 10.4-1.9 13.8-5.1l-7.6-5.9c-1.9 1.3-4.3 2-6.2 2-6.3 0-11.6-4-13.5-9.5l-7.4 5.5C7 41.3 14.8 47 24 47z"/>
  </svg>
);

const LoginPage = () => {
  const { login, loginWithGoogle, user } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Handle credential returned by Google Identity Services
  const handleGoogleCredential = async (response) => {
    setGoogleLoading(true);
    setError("");
    const res = await loginWithGoogle(response.credential);
    setGoogleLoading(false);
    if (res.success) {
      navigate("/dashboard");
    } else {
      setError(res.error || "Google sign-in failed. Please try again.");
    }
  };

  // Inject & initialize the Google Identity Services script
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
        use_fedcm_for_prompt: false,
        auto_select: false,
      });

      // Render standard button into hidden container for reliable fallback
      const hiddenBtn = document.getElementById("google-hidden-btn");
      if (hiddenBtn) {
        hiddenBtn.innerHTML = "";
        window.google.accounts.id.renderButton(hiddenBtn, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: "300",
        });
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    }
  }, []);

  const handleCustomGoogleClick = () => {
    if (googleLoading) return;
    setError("");
    
    // First try simulating click on rendered GSI button (bypasses browser popup blockers reliably)
    const hiddenBtn = document.getElementById("google-hidden-btn");
    const actualBtn = hiddenBtn?.querySelector("div[role=button]");
    if (actualBtn) {
      actualBtn.click();
      return;
    }

    // Fallback to prompt
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If prompt fails or gets dismissed, render/click standard button fallback
          const target = hiddenBtn?.querySelector("div[role=button]");
          if (target) target.click();
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate("/dashboard");
    } else {
      setError(res.error);
    }
  };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to start your exam assessment</p>

        {error && <div className="error-alert">{error}</div>}

        {/* Custom styled Google Sign-In button */}
        <button
          type="button"
          className="btn-google"
          onClick={handleCustomGoogleClick}
          disabled={!clientId || googleLoading || loading}
          title={!clientId ? "Configure VITE_GOOGLE_CLIENT_ID in frontend/.env to enable" : "Sign in with Google"}
        >
          {googleLoading ? (
            <span className="google-btn-spinner" />
          ) : (
            <GoogleIcon />
          )}
          <span>{googleLoading ? "Signing in with Google..." : "Continue with Google"}</span>
        </button>

        {/* Hidden container for GIS button trigger */}
        <div id="google-hidden-btn" style={{ position: "absolute", opacity: 0, pointerEvents: "none", zIndex: -1, width: 0, height: 0, overflow: "hidden" }} />

        <div className="auth-divider">or sign in with email or username</div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email or Username</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com or username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper" style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: "2.8rem", width: "100%" }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  color: "hsl(210, 15%, 60%)",
                }}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </span>
            </div>
          </div>

          <button type="submit" disabled={loading || googleLoading} className="btn-auth-submit">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
