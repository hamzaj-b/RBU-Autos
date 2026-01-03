// app/api/auth/admin/employee/[id]/reset-password/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { encryptPassword } from "@/lib/encryption";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

export async function POST(req, context) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { password } = body;

    if (!password || password.trim().length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "No token provided" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 🔍 Find linked user for employee
    const user = await prisma.user.findFirst({
      where: { employeeProfileId: id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Linked user not found for this employee." },
        { status: 404 }
      );
    }

    // 🔐 Encrypt new password using custom method
    const encrypted = encryptPassword(password.trim());

    // 🔄 Update password in user table
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordEncrypted: encrypted },
    });

    return NextResponse.json({
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
