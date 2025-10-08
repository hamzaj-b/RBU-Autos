const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const passwordSetupTemplate = require("@/lib/emailTemplates/newPassword");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function POST(req) {
  try {
    const { token, email, fullName } = await req.json();

    // Verify admin token
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          userType: "CUSTOMER",
          passwordEncrypted: null,
          isActive: true,
        },
      });

      const profile = await tx.customerProfile.create({
        data: { userId: user.id, fullName },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { customerProfileId: profile.id },
      });

      return { user, profile };
    });

    // Generate unique password setup token
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

    await transporter.sendMail({
      from: `"RBU Autos Garage CRM" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Set Your Password - RBU Autos Garage CRM",
      html: passwordSetupTemplate(fullName, link),
    });

    return NextResponse.json({
      message: "✅ Customer invited successfully. Email sent.",
      link,
      user: result.user,
      profile: result.profile,
    });
  } catch (err) {
    console.error("Invite customer error:", err);
    return NextResponse.json(
      { error: "Failed to invite customer" },
      { status: 500 }
    );
  }
}

module.exports = { POST };
