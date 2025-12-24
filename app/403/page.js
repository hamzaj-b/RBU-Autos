"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  ArrowLeft,
  ShieldAlert,
  Mail,
  User,
  AlertCircle,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function UnauthorizedPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f74b2] via-sky-800 to-blue-900 overflow-hidden">
      {/* ===== Enhanced Background Animations ===== */}
      {/* Primary Blobs */}
      <motion.div
        className="absolute top-[-5%] left-[-5%] w-[300px] h-[300px] bg-blue-500/15 rounded-full blur-[100px]"
        animate={{
          x: [0, 20, 0],
          y: [0, 20, 0],
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-5%] right-[-5%] w-[400px] h-[400px] bg-sky-400/15 rounded-full blur-[120px]"
        animate={{
          x: [0, -20, 0],
          y: [0, -20, 0],
          scale: [1, 1.05, 1],
          rotate: [0, -180, -360],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Secondary Blobs for Depth */}
      <motion.div
        className="absolute top-[20%] left-[20%] w-[200px] h-[200px] bg-blue-400/10 rounded-full blur-[80px]"
        animate={{
          x: [0, -15, 0],
          y: [0, 15, 0],
          scale: [1, 1.15, 1],
          rotate: [0, 90, 180],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      <motion.div
        className="absolute bottom-[30%] right-[10%] w-[250px] h-[250px] bg-sky-500/10 rounded-full blur-[90px]"
        animate={{
          x: [0, 10, 0],
          y: [0, -10, 0],
          scale: [1, 1.08, 1],
          rotate: [0, -90, -180],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />
      {/* Floating Particles - Increased Count */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-1 h-1 md:w-2 md:h-2 bg-white/25 rounded-full ${
            i % 2 === 0 ? "bg-blue-300/30" : "bg-sky-300/30"
          }`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 1, 0.3],
            x: [0, Math.random() * 60 - 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 6,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}
      {/* Subtle Wave Lines */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)
          `,
        }}
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />

      {/* ===== Central Container ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg px-6"
      >
        {/* ===== Enhanced Card ===== */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.7,
            ease: "easeOut",
            type: "spring",
          }}
          className="backdrop-blur-2xl bg-white/8 border border-white/10 shadow-2xl rounded-2xl px-8 py-10 text-center text-white relative overflow-hidden"
        >
          {/* Animated Border Glow - Removed Spin */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-sky-400/20 to-blue-500/20"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="relative mx-auto w-24 h-24 backdrop-blur-md  rounded-full bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 flex items-center justify-center mb-6 shadow-2xl"
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            // className="bg-white/10 backdrop-blur-md p-6 rounded-full shadow-2xl mb-8 border border-white/20"
          >
            <LockKeyhole className="w-16 h-16 text-white drop-shadow-lg" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white drop-shadow-md"
          >
            Access Denied
          </motion.h1>

          {/* Animated 403 Badge */}
          <AnimatePresence>
            {isVisible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 400 }}
                className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-500/15 border-2 border-red-400/30 rounded-full shadow-lg animate-pulse"
              >
                <span className="text-xl font-mono text-red-200">403</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-sky-100 text-sm leading-relaxed mb-2 px-2"
          >
            Your current permissions do not allow access to this section of the
            system.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-blue-200 text-xs mb-8 px-2 italic"
          >
            For assistance, consider the following steps:
          </motion.p>

          {/* Quick Actions List with Icons */}
          <motion.ul
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-left text-sky-100 text-sm space-y-3 mb-8 px-4"
          >
            <motion.li
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ delay: 1.0 }}
              className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <Mail className="w-3 h-3 text-blue-300" />
              </motion.div>
              Contact your administrator via email
            </motion.li>
            <motion.li
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ delay: 1.1 }}
              className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <ShieldAlert className="w-3 h-3 text-red-300" />
              </motion.div>
              Request elevated permissions
            </motion.li>
          </motion.ul>

          {/* Action Buttons with Staggered Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              href="/dashboard"
              className="group relative flex items-center justify-center gap-2 flex-1 bg-white/90 text-blue-900 font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/20"
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-sky-500/20 -translate-x-full group-hover:translate-x-full"
                initial={{ translateX: "-100%" }}
                whileHover={{ translateX: "100%" }}
                transition={{ duration: 0.5 }}
              />
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="relative">Return to Dashboard</span>
            </Link>
            <Link
              href="/auth/login"
              className="group relative flex items-center justify-center gap-2 flex-1 bg-white/10 border border-white/20 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-300 overflow-hidden"
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full"
                initial={{ translateX: "-100%" }}
                whileHover={{ translateX: "100%" }}
                transition={{ duration: 0.5 }}
              />
              <span className="relative">Re-Authenticate</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Enhanced Subtle Glow */}
        <motion.div
          className="absolute inset-0 -z-10 bg-gradient-to-t from-white/10 via-transparent to-transparent rounded-2xl blur-2xl opacity-30"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </motion.div>

      {/* ===== Enhanced Footer ===== */}
      <motion.footer
        className="absolute bottom-4 text-xs text-sky-200 flex items-center gap-2 px-6 rounded-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.3 }}
      >
        <ShieldAlert className="w-3 h-3" />© {new Date().getFullYear()} Garage
        Management System. All rights reserved. | Secure Access Required
      </motion.footer>
    </div>
  );
}
