"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load cookies when app starts
  useEffect(() => {
    const savedToken = Cookies.get("authToken");
    const savedUser = Cookies.get("authUser");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Login via your backend API
  async function login(email, password) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Login failed");
      }

      const data = await res.json();

      Cookies.set("authToken", data.token, { expires: 1 });
      Cookies.set("authUser", JSON.stringify(data.user), { expires: 1 });

      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error.message);
      return { success: false, message: error.message };
    }
  }

  function logout() {
    Cookies.remove("authToken");
    Cookies.remove("authUser");
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
