import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { adminAuth } from "@/lib/firebaseAdmin";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

export async function POST(req) {
  try {
    const { phone, firebaseToken } = await req.json();

    // 🧩 Validate input
    if (!phone || !firebaseToken) {
      return NextResponse.json(
        { error: "Phone and Firebase token are required" },
        { status: 400 }
      );
    }

    // ✅ Verify Firebase ID token
    const decoded = await adminAuth.verifyIdToken(firebaseToken);
    const verifiedPhone = decoded.phone_number;

    if (!verifiedPhone || verifiedPhone !== phone) {
      return NextResponse.json(
        { error: "Phone verification failed" },
        { status: 401 }
      );
    }

    // 🔍 Find matching customer user
    const user = await prisma.user.findUnique({
      where: { phone },
      include: { customer: true },
    });

    if (!user || user.userType !== "CUSTOMER") {
      return NextResponse.json(
        { error: "No valid customer found with this phone number" },
        { status: 404 }
      );
    }

    // 🧱 Build token payload
    const tokenPayload = {
      id: user.id,
      phone: user.phone,
      userType: user.userType,
    };

    let username = "Customer";

    if (user.userType === "CUSTOMER" && user.customerProfileId) {
      tokenPayload.customerId = user.customerProfileId;
      username = user.customer?.fullName || username;
    }

    // 🪙 Create JWT
    const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: "24h" });

    // ✅ Send response
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        userType: user.userType,
        customerId: user.customerProfileId || null,
        username,
      },
    });
  } catch (err) {
    console.error("❌ verify-login error:", err);
    return NextResponse.json(
      { error: "OTP verification failed" },
      { status: 500 }
    );
  }
}
