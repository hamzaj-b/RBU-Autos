"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // Restore auth state from cookies/localStorage
  // ============================================================
  useEffect(() => {
    const savedToken = Cookies.get("authToken");
    const savedUser = Cookies.get("authUser");
    const savedSessionId = localStorage.getItem("sessionId");

    if (savedToken && savedUser) {
      const userData = JSON.parse(savedUser);
      setToken(savedToken);
      setUser(userData);
      setUsername(userData.username || null);

      if (userData.userType === "EMPLOYEE" && savedSessionId) {
        setSessionId(savedSessionId);
      }
    }
    setLoading(false);
  }, []);

  // ============================================================
  // LOGIN  (NO SESSION START ANYMORE)
  // ============================================================
  async function login(email, password) {
    toast.loading("Logging in...", { id: "login" });

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // Store cookies
      Cookies.set("authToken", data.token, { expires: 1 });
      Cookies.set("authUser", JSON.stringify(data.user), { expires: 1 });

      setToken(data.token);
      setUser(data.user);
      setUsername(data.user.username || null);

      toast.success(`Welcome ${data.user.username || "User"}!`, {
        id: "login",
      });

      // REDIRECT (without session start)
      if (data.user.userType === "ADMIN") {
        window.location.href = "/";
      } else {
        window.location.href = "/dashboard"; // employee or customer
      }

      return { success: true };
    } catch (err) {
      toast.error(err.message || "Login failed", { id: "login" });
      return { success: false, message: err.message };
    }
  }

  // ============================================================
  // CUSTOMER OTP LOGIN
  // ============================================================
  async function loginWithOTP(phone, firebaseToken) {
    toast.loading("Verifying OTP...", { id: "otpLogin" });

    try {
      const res = await fetch("/api/auth/customer/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, firebaseToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP verification failed");

      Cookies.set("authToken", data.token, { expires: 1 });
      Cookies.set("authUser", JSON.stringify(data.user), { expires: 1 });

      setToken(data.token);
      setUser(data.user);
      setUsername(data.user.username || null);

      toast.success(`Welcome ${data.user.username || "Customer"}!`, {
        id: "otpLogin",
      });

      window.location.href = "/dashboard";

      return { success: true };
    } catch (err) {
      toast.error(err.message || "OTP login failed", { id: "otpLogin" });
      return { success: false, message: err.message };
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================
  async function logout() {
    toast.loading("Logging out...", { id: "logout" });

    try {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      Cookies.remove("authToken");
      Cookies.remove("authUser");
      localStorage.removeItem("sessionId");

      setUser(null);
      setToken(null);
      setUsername(null);
      setSessionId(null);

      toast.success("Logged out!", { id: "logout" });
    }
  }

  // ===================================================================
  // Provide context values
  // ===================================================================
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        username,
        sessionId,
        setSessionId,
        login,
        loginWithOTP,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
