import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Normalize phone to E.164-like format: +<digits>
 * Examples:
 * "+996 595742424"  -> "+996595742424"
 * "+996595742424"   -> "+996595742424"
 * "996 595742424"   -> "+996595742424"
 */
function normalizePhone(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  const digits = s.replace(/\D/g, ""); // remove spaces, dashes, brackets etc.
  return digits ? `+${digits}` : "";
}

export async function POST(req) {
  try {
    const { email, phone } = await req.json();

    if (!email && !phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide either email or phone number.",
        },
        { status: 400 }
      );
    }

    let user = null;

    // ===========================
    // EMAIL LOOKUP
    // ===========================
    if (email) {
      user = await prisma.user.findFirst({
        where: { email },
        include: { customer: true },
      });
    }

    // ===========================
    // PHONE LOOKUP (space/no-space safe)
    // Mongo + Prisma note:
    // Avoid startsWith("+...") because it becomes invalid regex (^+...)
    // ===========================
    if (!user && phone) {
      const incomingNorm = normalizePhone(phone);

      if (!incomingNorm) {
        return NextResponse.json(
          { success: false, error: "Invalid phone number." },
          { status: 400 }
        );
      }

      const incomingDigits = incomingNorm.replace(/\D/g, ""); // digits only

      // Use last 9 digits as a "tail" to reduce collisions but still match spaced formats
      // (you can change 9 -> 8/10 based on your data)
      const tail = incomingDigits.slice(-9);

      // Broad search by digits (contains), then exact-match in JS after normalization
      const candidates = await prisma.user.findMany({
        where: {
          phone: { not: null },
          phone: { contains: tail }, // ✅ safe, doesn't start with '+'
        },
        include: { customer: true },
        take: 50,
      });

      user =
        candidates.find((u) => normalizePhone(u.phone) === incomingNorm) ||
        null;
    }

    // ===========================
    // NOT FOUND
    // ===========================
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "No customer found with provided credentials.",
        },
        { status: 404 }
      );
    }

    // ===========================
    // CUSTOMER ONLY
    // ===========================
    if (user.userType !== "CUSTOMER") {
      return NextResponse.json(
        {
          success: false,
          error: "This account type is not allowed for Customer Login (OTP).",
        },
        { status: 403 }
      );
    }

    // ===========================
    // MUST HAVE PHONE
    // ===========================
    if (!user.phone) {
      return NextResponse.json(
        {
          success: false,
          error: "This customer does not have a registered phone number.",
        },
        { status: 400 }
      );
    }

    // ✅ return normalized phone for firebase OTP (best)
    return NextResponse.json({
      success: true,
      message: "Customer verified. Proceed to send OTP.",
      phone: normalizePhone(user.phone),
      customer: {
        id: user.id,
        email: user.email,
        fullName: user.customer?.fullName || "Customer",
      },
    });
  } catch (err) {
    console.error("❌ customer/login error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
