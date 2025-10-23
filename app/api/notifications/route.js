import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || "supersecret";

export async function GET(req) {
  try {
    // 🧩 Handle case-insensitive headers
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");

    if (!authHeader) {
      console.warn("🚫 No Authorization header received");
      return NextResponse.json(
        { error: "No Authorization header" },
        { status: 401 }
      );
    }

    // 🪙 Extract token cleanly
    const token = authHeader.replace("Bearer", "").trim();

    if (!token) {
      console.warn("🚫 No token provided after Bearer");
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // 🔍 Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET);
    } catch (err) {
      console.error("❌ JWT verification failed:", err);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // ✅ Fetch notifications for this user
    const notifications = await prisma.notification.findMany({
      where: { userId: decoded.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, userType: true } },
      },
    });

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (err) {
    console.error("❌ Fetch notifications error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
