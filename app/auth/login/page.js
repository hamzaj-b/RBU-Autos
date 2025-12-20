"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "@/lib/firebase";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const { login, loginWithOTP } = useAuth();

  // Shared tab state
  const [activeTab, setActiveTab] = useState("employee");

  // ===== Employee/Admin Fields =====
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ✅ added
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ===== Customer OTP Fields =====
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [resolvedPhone, setResolvedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);

  // ===========================
  // EMPLOYEE / ADMIN LOGIN
  // ===========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.success) setError(res.message);
  };

  // ===========================
  // CUSTOMER LOGIN (OTP)
  // ===========================
  const handleStartLogin = async () => {
    try {
      setOtpLoading(true);
      setError("");
      toast.loading("Checking account...", { id: "otpFlow" });

      const body = emailOrPhone.startsWith("+")
        ? { phone: emailOrPhone }
        : { email: emailOrPhone };

      const res = await fetch("/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Customer not found", { id: "otpFlow" });
        setOtpLoading(false);
        return;
      }

      const phone = data.phone;
      setResolvedPhone(phone);

      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => console.log("reCAPTCHA verified ✅"),
          }
        );
      }

      const result = await signInWithPhoneNumber(
        auth,
        phone,
        window.recaptchaVerifier
      );
      setConfirmationResult(result);

      toast.success(`✅ OTP sent to ${phone}`, { id: "otpFlow" });
    } catch (err) {
      console.error("❌ OTP Send Error:", err);
      toast.error(err.message || "Failed to send OTP", { id: "otpFlow" });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult) {
      toast.error("Please request OTP first.");
      return;
    }

    try {
      const userCred = await confirmationResult.confirm(otp);
      const idToken = await userCred.user.getIdToken();

      const result = await loginWithOTP(resolvedPhone, idToken);
      if (!result.success) {
        toast.error(result.message || "OTP login failed", {
          id: "otpVerify",
        });
      }
    } catch (err) {
      console.error("❌ OTP Verify Error:", err);
      toast.error("Invalid or expired OTP.", { id: "otpVerify" });
    }
  };

  // ===========================
  // UI
  // ===========================
  return (
    <section className="bg-gradient-to-tr from-blue-theme via-blue-bold to-sky-300 min-h-screen text-gray-800 flex items-center justify-center">
      <div className="w-full max-w-md bg-white border rounded-lg shadow-lg p-6 mx-2">
        {/* ===== Logo + Title ===== */}
        <div className="text-center mb-4">
          <img src="/rbu-logo.png" alt="Logo" width={100} className="mx-auto" />
          <h2 className="text-2xl font-extrabold text-gray-800 mt-2">
            RBU Autos CRM
          </h2>
        </div>

        {/* ===== Tab Switcher ===== */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gray-100 rounded-md p-1 flex w-full max-w-xs shadow-inner">
            <button
              onClick={() => setActiveTab("employee")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300
              ${
                activeTab === "employee"
                  ? "bg-blue-theme !text-white shadow"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Admin / Employee
            </button>

            <button
              onClick={() => setActiveTab("customer")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300
              ${
                activeTab === "customer"
                  ? "bg-blue-theme !text-white shadow"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Customer
            </button>
          </div>
        </div>

        {/* ===== Admin / Employee Login ===== */}
        {activeTab === "employee" && (
          <>
            <h1 className="text-xl font-bold text-center mb-6">
              Login to your account
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Password
                </label>

                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full border border-gray-300 rounded-lg p-2.5 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {/* 👁 Eye Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[35px] text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-theme !text-white font-bold py-2.5 rounded-lg hover:bg-blue-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </>
        )}

        {/* ===== Customer OTP Login ===== */}
        {activeTab === "customer" && (
          <>
            <h1 className="text-xl font-bold text-center mb-6">
              Customer Login (OTP)
            </h1>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Email or Phone
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                  placeholder="Email or +1XXXXXXXXXX"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                />
              </div>

              {!confirmationResult ? (
                <button
                  onClick={handleStartLogin}
                  disabled={otpLoading}
                  className="w-full bg-blue-theme !text-white font-bold py-2.5 rounded-lg hover:bg-blue-bold disabled:opacity-50"
                >
                  {otpLoading ? "Sending..." : "Send OTP"}
                </button>
              ) : (
                <>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg p-2.5"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleVerifyOtp}
                    className="w-full bg-green-600 !text-white font-bold py-2.5 rounded-lg hover:bg-green-700"
                  >
                    Verify OTP
                  </button>
                </>
              )}
            </div>
            <div id="recaptcha-container"></div>
          </>
        )}
      </div>
    </section>
  );
}
