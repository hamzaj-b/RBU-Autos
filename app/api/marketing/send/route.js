// app/api/marketing/send/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// Adjust path as needed for your project structure
import marketingTemplate from "@/lib/emailTemplates/marketingtemplate";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// ---------------------------------------------------------------------------
// FIXED TRANSPORTER CONFIGURATION
// 1. We use port 587 (Submission).
// 2. We set 'secure: false' (implies STARTTLS).
// 3. We set 'rejectUnauthorized: false' to handle the internal Docker SSL.
// ---------------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "mx.rbuauto.ca",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // Must be false for port 587
  auth: {
    user: process.env.SMTP_USER || "info@rbuauto.ca",
    pass: process.env.SMTP_PASS, // Ensure this is set in .env
  },
  // This explicitly sets the HELO/EHLO hostname to match your DNS
  name: "crm.rbuauto.ca", 
  tls: {
    // CRITICAL: This allows the connection even if the internal Docker IP 
    // doesn't perfectly match the SSL certificate name.
    rejectUnauthorized: false,
  },
});

// Helper: Simple email validation
function isValidEmail(email) {
  if (!email) return false;
  const e = String(email).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function POST(req) {
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

    // 1. Basic Validation
    if (!token) {
      return NextResponse.json({ error: "Token is required." }, { status: 400 });
    }
    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json({ error: "customerIds[] is required." }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    // 2. Auth Check
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 3. Fetch Targets
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

    // 4. Filter Valid vs Invalid Emails
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
        continue; 
      }

      targets.push({
        userId: u.id,
        profileId: u.customerProfileId || null,
        email,
        fullName,
      });
    }

    // Identify IDs that didn't match any user record
    const validUserIds = new Set(users.map((u) => u.id));
    const validProfileIds = new Set(
      users.map((u) => u.customerProfileId).filter(Boolean)
    );
    const invalidIds = customerIds.filter(
      (id) => !validUserIds.has(id) && !validProfileIds.has(id)
    );

    // Stop if no valid targets
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

    // 5. Send Emails (Batched)
    const fromEmail = process.env.SMTP_USER || "info@rbuauto.ca";
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

      // Process batch results
      results.forEach((r, idx) => {
        const email = batch[idx]?.email;
        if (r.status === "fulfilled") {
          sent++;
        } else {
          failed++;
          failures.push({ email, error: r.reason?.message || "Failed" });
          console.error(`Failed to send to ${email}:`, r.reason);
        }
      });
    }

    // 6. Return Summary
    return NextResponse.json({
      message: "Marketing email process completed.",
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