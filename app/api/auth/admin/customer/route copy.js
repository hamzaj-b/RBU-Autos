const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const passwordSetupTemplate = require("@/lib/emailTemplates/newPassword");

const prisma = new PrismaClient();

const SECRET_KEY = process.env.JWT_SECRET || "supersecret";
const APP_URL = process.env.APP_URL || "https://garage-mechanic-crm.vercel.app";

// ============================
// DYNAMIC SMTP TRANSPORTER
// ============================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // "true" or "false"
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // TLS override only when explicitly needed
  ...(process.env.SMTP_IGNORE_TLS === "true"
    ? { tls: { rejectUnauthorized: false } }
    : {}),
});

// ============================
// ROUTE
// ============================
async function POST(req) {
  let createdUserId = null;

  try {
    const { token, email, fullName, phone } = await req.json();

    // Validate
    if (!email || !fullName || !phone) {
      return NextResponse.json(
        { error: "email, fullName and phone are required." },
        { status: 400 }
      );
    }

    // Verify admin
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check existing
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User with this email or phone already exists" },
        { status: 400 }
      );
    }

    // ============================
    // CREATE USER + PROFILE
    // ============================
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          phone,
          userType: "CUSTOMER",
          passwordEncrypted: null,
          isActive: true,
        },
      });

      const profile = await tx.customerProfile.create({
        data: {
          userId: user.id,
          fullName,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { customerProfileId: profile.id },
      });

      createdUserId = user.id;

      return { user, profile };
    });

    // ============================
    // CREATE PASSWORD TOKEN
    // ============================
    const setPassToken = jwt.sign(
      {
        id: result.user.id,
        email: result.user.email,
        purpose: "SET_PASSWORD",
        jti: crypto.randomUUID(),
      },
      SECRET_KEY,
      { expiresIn: "15m" }
    );

    const link = `${APP_URL}/auth/newPassword?token=${setPassToken}`;

    // ============================
    // SEND EMAIL
    // ============================
    await transporter.sendMail({
      from: `"RBU Autos Garage CRM" <${
        process.env.SMTP_FROM || process.env.SMTP_USER
      }>`,
      to: email,
      subject: "Set Your Password - RBU Autos Garage CRM",
      html: passwordSetupTemplate(fullName, link),
    });

    return NextResponse.json({
      message: "Customer invited successfully. Email sent.",
      link,
      user: result.user,
      profile: result.profile,
    });
  } catch (err) {
    console.error("Invite customer error:", err);

    // ============================
    // ROLLBACK USER + PROFILE
    // ============================
    if (createdUserId) {
      try {
        await prisma.customerProfile.deleteMany({
          where: { userId: createdUserId },
        });
        await prisma.user.delete({ where: { id: createdUserId } });
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }
    }

    return NextResponse.json(
      {
        error: "Failed to invite customer",
        details: err.message,
      },
      { status: 500 }
    );
  }
}

module.exports = { POST };
