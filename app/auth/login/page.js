"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

export default function SignInPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.success) setError(res.message);
  };

  return (
    <section className="bg-blue-theme min-h-screen text-gray-800 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6 mx-2">
        <div className="text-center mb-4">
          <img src="/rbu-logo.png" alt="Logo" width={100} className="mx-auto" />
          <h2 className="text-2xl font-extrabold text-gray-800 mt-2">
            RBU Autos CRM
          </h2>
        </div>

        <h1 className="text-xl font-bold  text-center mb-6">
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

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg p-2.5"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-theme !text-white font-bold py-2.5 rounded-lg hover:bg-blue-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {/* {!isLocationValid && (
            <p className="text-xs text-yellow-600 text-center">
              Please allow location access to proceed. Refresh the page to
              retry.
            </p>
          )} */}

          <p className="text-sm text-center text-gray-500 mt-3">
            Don’t have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-blue-bold font-semibold hover:underline"
            >
              Get Started
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
