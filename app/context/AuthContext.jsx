"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Load cookies and localStorage when app starts
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

  // 🔑 Login via backend API
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

      // 🪙 Store auth data in cookies
      Cookies.set("authToken", data.token, { expires: 1 });
      Cookies.set("authUser", JSON.stringify(data.user), { expires: 1 });

      setToken(data.token);
      setUser(data.user);
      setUsername(data.user.username || null);

      toast.success(`Welcome ${data.user.username || "User"}!`, {
        id: "login",
      });

      // 🧠 Start session if Employee
      if (data.user.userType === "EMPLOYEE") {
        toast.loading("Starting employee session...", { id: "session" });

        try {
          const sessionRes = await fetch("/api/employeeSession/start", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.token}`,
            },
            body: JSON.stringify({ source: "web", location: "unknown" }),
          });

          const sessionData = await sessionRes.json();

          if (sessionRes.ok) {
            setSessionId(sessionData.session.id);
            localStorage.setItem("sessionId", sessionData.session.id);
            toast.success("🕒 Session started successfully!", {
              id: "session",
            });
          } else {
            toast.error(sessionData.error || "Failed to start session", {
              id: "session",
            });
          }
        } catch (err) {
          console.error("Error starting session:", err);
          toast.error("Error starting session", { id: "session" });
        }
      } else {
        // Non-employee → clear session
        setSessionId(null);
        localStorage.removeItem("sessionId");
      }

      // 🚀 Redirect based on role
      if (data.user.userType === "ADMIN") {
        window.location.href = "/";
      } else {
        window.location.href = "/dashboard";
      }

      return { success: true };
    } catch (error) {
      console.error("Login error:", error.message);
      toast.error(error.message || "Login failed", { id: "login" });
      return { success: false, message: error.message };
    }
  }

  // 🚪 Logout
  async function logout() {
    toast.loading("Logging out...", { id: "logout" });

    try {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Logout API error:", error.message);
    } finally {
      // 🧹 Clear everything
      Cookies.remove("authToken");
      Cookies.remove("authUser");
      localStorage.removeItem("sessionId");

      setUser(null);
      setToken(null);
      setUsername(null);
      setSessionId(null);

      toast.success("👋 Logged out successfully!", { id: "logout" });
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, token, username, sessionId, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
