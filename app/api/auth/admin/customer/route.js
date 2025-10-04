const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const passwordSetupTemplate = require("@/lib/emailTemplates/newPassword");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// Gmail transporter using App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your gmail address
    pass: process.env.EMAIL_PASS, // 16-char App Password
  },
});

async function POST(req) {
  try {
    const body = await req.json();
    const { token, email, fullName } = body;

    // 1. verify admin token
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
      if (decoded.userType !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // 2. check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // 3. create user (no password yet)
    const user = await prisma.user.create({
      data: {
        email,
        userType: "CUSTOMER",
        passwordEncrypted: null,
      },
    });

    // 4. create customer profile
    const profile = await prisma.customerProfile.create({
      data: { userId: user.id, fullName },
    });

    // 5. update user with profileId
    await prisma.user.update({
      where: { id: user.id },
      data: { customerProfileId: profile.id },
    });

    // 6. generate password setup token (15 min expiry)
    const setPassToken = jwt.sign(
      { id: user.id, email: user.email, purpose: "SET_PASSWORD" },
      SECRET_KEY,
      { expiresIn: "15m" }
    );

    const link = `https://garage-mechanic-crm.vercel.app/auth/newPassword?token=${setPassToken}`;
    console.log("Toekn is:", setPassToken);

    // 7. send email
    await transporter.sendMail({
      from: `"RBU Autos Garage CRM" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Set Your Password - RBU Autos Garage CRM",
      html: passwordSetupTemplate(fullName, link),
    });

    return NextResponse.json({
      message: "Customer created. Password setup email sent.",
      link, // keep for debugging
      user,
      profile,
    });
  } catch (err) {
    console.error("Error creating customer:", err);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}

module.exports = { POST };
