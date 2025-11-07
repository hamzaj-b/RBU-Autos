import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { email, phone } = await req.json();

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Please provide either email or phone number." },
        { status: 400 }
      );
    }

    // 🔍 Lookup logic
    let user = null;

    if (email) {
      user = await prisma.user.findUnique({
        where: { email },
        include: { customer: true },
      });
    } else if (phone) {
      user = await prisma.user.findUnique({
        where: { phone },
        include: { customer: true },
      });
    }

    // ❌ If not found
    if (!user) {
      return NextResponse.json(
        { error: "No customer found with provided credentials." },
        { status: 404 }
      );
    }

    // 🚫 Restrict to CUSTOMER only
    if (user.userType !== "CUSTOMER") {
      return NextResponse.json(
        { error: "This account type is not allowed for Customer Login (OTP)." },
        { status: 403 }
      );
    }

    // ✅ Customer found — return phone for frontend OTP
    if (!user.phone) {
      return NextResponse.json(
        { error: "This customer does not have a registered phone number." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Customer verified. Proceed to send OTP.",
      phone: user.phone, // 👈 frontend uses this to send OTP
      customer: {
        id: user.id,
        email: user.email,
        fullName: user.customer?.fullName || "Customer",
      },
    });
  } catch (err) {
    console.error("❌ customer/login error:", err);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
