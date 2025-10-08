"use client";
import { Modal, Input } from "antd";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export default function InviteModal({
  open,
  setOpen,
  formData,
  setFormData,
  handleInvite,
  loading,
}) {
  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={550}
      centered
      className="rounded-2xl overflow-hidden"
      title={
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-gray-800">
            ✉️ Invite New Customer
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Send a password setup link directly to the customer’s email.
          </p>
        </div>
      }
    >
      <div className="space-y-6 mt-4">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-700 mb-3">
            👤 Customer Information
          </h3>
          <div>
            <label className="text-sm font-medium text-gray-600">
              Full Name
            </label>
            <Input
              placeholder="Full Name"
              value={formData.fullName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, fullName: e.target.value }))
              }
            />
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <Input
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
          <div className="bg-amber-200 text-amber-700 rounded w-7 h-7 flex items-center justify-center font-bold">
            !
          </div>
          <p className="text-sm text-amber-700">
            The customer will receive an email with a secure link to set their
            password. This link will expire in <strong>15 minutes</strong>.
          </p>
        </div>

        <Button
          onClick={handleInvite}
          disabled={loading}
          className={`w-full font-medium py-2.5 rounded-lg shadow-md ${
            loading
              ? "bg-gray-300 text-gray-700"
              : "bg-amber-500 hover:bg-amber-600 text-white"
          }`}
        >
          <Send className="w-4 h-4 " />
          {loading ? "Sending Invite..." : "Send Invite"}
        </Button>
      </div>
    </Modal>
  );
}
