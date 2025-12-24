"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// ✅ Inner component that uses useSearchParams
function NewPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage("Invalid or missing token.");
    }
  }, [token]);
  console.log("sajd", token);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirm) {
      setMessage("❌ Passwords do not match");
      return;
    }

    if (!token) {
      setMessage("❌ Invalid or missing token.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Password set successfully! Redirecting to login...");
        setTimeout(() => router.push("/auth/login"), 2000);
      } else {
        setMessage(`❌ ${data.error || "Failed to set password"}`);
      }
    } catch (err) {
      setMessage("❌ Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-blue-theme min-h-screen flex items-center justify-center text-gray-800">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-4 flex flex-col gap-4">
          <img src="/logoDark.png" alt="Logo" width={100} className="mx-auto" />
          <h2 className="text-2xl font-bold text-gray-800 mt-2">
            RBU Autos CRM
          </h2>
        </div>

        <h1 className="text-2xl font-bold text-center mb-4">
          Create New Password
        </h1>
        <p className="text-gray-500 text-center mb-6">
          Please enter a new password different from your old one.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {message && (
            <p
              className={`text-center text-sm ${
                message.startsWith("✅")
                  ? "text-green-600"
                  : "text-red-600 font-medium"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-theme !text-white font-bold py-2.5 rounded-lg hover:bg-blue-bold disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </section>
  );
}

// ✅ Outer wrapper with Suspense (fixes build error)
export default function NewPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Loading...</div>}>
      <NewPasswordForm />
    </Suspense>
  );
}
