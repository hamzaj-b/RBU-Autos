// app/api/marketing/send/route.js
const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const marketingTemplate = require("@/lib/emailTemplates/marketingtemplate");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  ...(process.env.SMTP_IGNORE_TLS === "true"
    ? { tls: { rejectUnauthorized: false } }
    : {}),
});

// simple email check
function isValidEmail(email) {
  if (!email) return false;
  const e = String(email).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

async function POST(req) {
  try {
    const body = await req.json();
    const {
      token,
      customerIds,
      headline,
      message,
      ctaText,
      ctaLink,
      footerNote,
      brandName,
      subject,
    } = body || {};

    if (!token) {
      return NextResponse.json(
        { error: "token is required." },
        { status: 400 }
      );
    }
    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json(
        { error: "customerIds[] is required." },
        { status: 400 }
      );
    }
    if (!message) {
      return NextResponse.json(
        { error: "message is required." },
        { status: 400 }
      );
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: {
        userType: "CUSTOMER",
        isActive: true,
        OR: [
          { id: { in: customerIds } },
          { customerProfileId: { in: customerIds } },
        ],
      },
      select: {
        id: true,
        email: true,
        customerProfileId: true,
        customer: { select: { fullName: true } },
      },
    });

    // ✅ build targets + skipped
    const targets = [];
    const skippedNoEmail = [];

    for (const u of users) {
      const email = (u.email || "").trim();
      const fullName = u.customer?.fullName || "Customer";

      if (!isValidEmail(email)) {
        skippedNoEmail.push({
          userId: u.id,
          profileId: u.customerProfileId || null,
          fullName,
          email: email || null,
        });
        continue; // ✅ skip
      }

      targets.push({
        userId: u.id,
        profileId: u.customerProfileId || null,
        email,
        fullName,
      });
    }

    // invalid IDs against BOTH user ids and profile ids
    const validUserIds = new Set(users.map((u) => u.id));
    const validProfileIds = new Set(
      users.map((u) => u.customerProfileId).filter(Boolean)
    );
    const invalidIds = customerIds.filter(
      (id) => !validUserIds.has(id) && !validProfileIds.has(id)
    );

    // ✅ If ALL are skipped (no emails), return helpful response
    if (targets.length === 0) {
      return NextResponse.json(
        {
          error: "No valid customer emails found.",
          invalidIds,
          skippedNoEmailCount: skippedNoEmail.length,
          skippedNoEmail: skippedNoEmail.slice(0, 50),
        },
        { status: 400 }
      );
    }

    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const finalSubject = subject || headline || "New Update";
    const BATCH_SIZE = 25;

    let sent = 0;
    let failed = 0;
    const failures = [];

    for (let i = 0; i < targets.length; i += BATCH_SIZE) {
      const batch = targets.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((t) =>
          transporter.sendMail({
            from: `"${brandName || "RBU Autos Garage CRM"}" <${fromEmail}>`,
            to: t.email,
            subject: finalSubject,
            html: marketingTemplate({
              fullName: t.fullName,
              headline: headline || finalSubject,
              message,
              ctaText: ctaText || "View Details",
              ctaLink,
              footerNote: footerNote || "",
              unsubscribeLink: "#",
              brandName: brandName || "RBU Autos Garage CRM",
            }),
          })
        )
      );

      results.forEach((r, idx) => {
        const email = batch[idx]?.email;
        if (r.status === "fulfilled") sent++;
        else {
          failed++;
          failures.push({ email, error: r.reason?.message || "Failed" });
        }
      });
    }

    return NextResponse.json({
      message: "Marketing email sent.",
      requested: customerIds.length,
      matchedUsers: users.length,
      targetsWithEmail: targets.length,
      skippedNoEmailCount: skippedNoEmail.length,
      sent,
      failed,
      invalidIds,
      failures: failures.slice(0, 20),
      skippedNoEmail: skippedNoEmail.slice(0, 20),
    });
  } catch (err) {
    console.error("Marketing send error:", err);
    return NextResponse.json(
      { error: "Failed to send marketing emails", details: err.message },
      { status: 500 }
    );
  }
}

module.exports = { POST };
