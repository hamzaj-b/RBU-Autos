"use client";

import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function LogoutDialog({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title = "Ready to log out?",
  description = "You’ll be signed out of the dashboard.",
}) {
  const handleConfirm = async () => {
    try {
      await onConfirm?.(); // ✅ execute parent logout logic
      onClose?.();
    } catch (err) {
      console.error("Logout confirmation error:", err);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !loading && !open && onClose?.()}
    >
      <DialogContent
        className="sm:max-w-md border-0 p-0 overflow-hidden shadow-2xl"
        onInteractOutside={(e) => loading && e.preventDefault()}
        onEscapeKeyDown={(e) => loading && e.preventDefault()}
      >
        {/* 🔹 Header / Hero Section */}
        <div className="relative items-center bg-gradient-to-br from-[#0f74b2] via-sky-800 to-blue-900 text-white p-6 flex justify-start gap-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/20"
          >
            <LogOut className="h-6 w-6" />
          </motion.div>

          <DialogHeader className="mt-4 p-0 text-white">
            <DialogTitle className="text-xl leading-tight font-semibold">
              {title}
            </DialogTitle>
            <DialogDescription className="text-white/80 text-sm">
              {description}
            </DialogDescription>
          </DialogHeader>

          {/* Glow Overlay */}
          <div className="pointer-events-none absolute -inset-1 -z-10 bg-[radial-gradient(1200px_400px_at_10%_-10%,rgba(255,255,255,0.12),transparent)]" />
        </div>

        {/* 🔸 Footer / Actions */}
        <div className="p-5 sm:p-6 bg-white">
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="h-10 bg-[#0f74b2] !text-white hover:bg-blue-bold"
            >
              {loading ? "Logging out…" : "Log out"}
            </Button>
          </div>

          <p className="mt-3 text-xs text-center text-gray-500">
            You can sign back in anytime using your credentials.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
