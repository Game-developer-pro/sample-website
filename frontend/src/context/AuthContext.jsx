import React, { createContext, useState, useEffect, useRef } from "react";
import axios from "axios";

export const AuthContext = createContext();

// Normalize BASE_URL so it always points to .../api even if set without it in Vercel
const rawApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const BASE_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

// In production (https), WebSocket must use wss://; in dev (http) use ws://
const WS_URL = BASE_URL.replace(/^https/, "wss").replace(/^http/, "ws").replace(/\/api$/, "");

// Create configured axios instance
export const api = axios.create({
  baseURL: BASE_URL,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);
  const wsReconnect = useRef(null);

  // --- WebSocket presence: open when logged in, close on logout ---
  const openPresenceWS = (currentUser) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "IDENTIFY",
        userId: currentUser?._id || currentUser?.id,
        isAdmin: currentUser?.role === "admin",
      }));
    };

    ws.onclose = () => {
      // Auto-reconnect while user is still logged in
      wsReconnect.current = setTimeout(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) openPresenceWS(JSON.parse(storedUser));
      }, 5000);
    };

    ws.onerror = () => ws.close();
  };

  const closePresenceWS = () => {
    clearTimeout(wsReconnect.current);
    wsRef.current?.close();
    wsRef.current = null;
  };

  // Sync token with axios header
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Set user on load
  useEffect(() => {
    const checkUser = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser && token) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          openPresenceWS(parsed);
        } catch (e) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    checkUser();
    return () => closePresenceWS();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token: newToken, user: newUser } = response.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      openPresenceWS(newUser);
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      const message = error.response?.data?.message || "Invalid credentials. Please try again.";
      return { success: false, error: message };
    }
  };

  // Register handler
  const register = async (name, username, email, password, role = "user") => {
    try {
      const response = await api.post("/auth/register", { name, username, email, password, role });
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error("Registration failed:", error);
      const message = error.response?.data?.message || "Registration failed. Try again.";
      return { success: false, error: message };
    }
  };

  // Google OAuth handler — credential is the raw ID token from Google GSI
  const loginWithGoogle = async (credential) => {
    try {
      const response = await api.post("/auth/google", { credential });
      const { token: newToken, user: newUser } = response.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      openPresenceWS(newUser);
      return { success: true };
    } catch (error) {
      console.error("Google auth failed:", error);
      const message = error.response?.data?.message || "Google sign-in failed. Try again.";
      return { success: false, error: message };
    }
  };

  // Update profile handler
  const updateProfile = async (name, username, email, password) => {
    try {
      const response = await api.put("/auth/profile", { name, username, email, password });
      const { user: updatedUser } = response.data;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return { success: true, message: response.data.message || "Profile updated successfully" };
    } catch (error) {
      console.error("Profile update failed:", error);
      const message = error.response?.data?.message || "Profile update failed. Try again.";
      return { success: false, error: message };
    }
  };

  // Direct user state updater (e.g. after payment verification)
  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem("user", JSON.stringify(merged));
      return merged;
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    closePresenceWS();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, loginWithGoogle, logout, updateProfile, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
