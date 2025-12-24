const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

/**
 * Convert garage closing time (local timezone) → UTC Date for the login day.
 */
function getCloseTimeUtcForLogin(loginAt, closeTime, timezone) {
  const localFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const localDateStr = localFormatter.format(loginAt); // e.g. 2025-10-23
  const localDateTimeStr = `${localDateStr}T${closeTime}:00`;

  // Wall clock local time
  const localDate = new Date(localDateTimeStr);

  // 2️⃣ Figure out the *actual UTC offset* (in minutes) of that timezone at that moment
  const tzOffsetMin = -localDate
    .toLocaleString("en-US", { timeZone: timezone })
    .match(/(\d+):(\d+):(\d+)/) // not reliable, use arithmetic instead
    ? 0
    : 0; // placeholder to keep syntax

  // --- simpler and bulletproof approach: compute via arithmetic ---
  const fake = new Date(
    localDate.toLocaleString("en-US", { timeZone: timezone })
  );
  const offsetMinutes = (fake.getTime() - localDate.getTime()) / 60000;

  // 3️⃣ Apply offset in correct direction (local → UTC)
  const utcDate = new Date(localDate.getTime() - offsetMinutes * 60000);

  // console.log("🔹 [getCloseTimeUtcForLogin]");
  // console.log("Local Date:", localDateStr);
  // console.log("Local CloseTime:", closeTime);
  // console.log("Offset (min):", offsetMinutes);
  // console.log("→ Computed UTC CloseTime:", utcDate.toISOString());

  return utcDate;
}

async function POST(req) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // Validate employee token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(authHeader.split(" ")[1], SECRET_KEY);

    if (decoded.userType !== "EMPLOYEE") {
      return NextResponse.json(
        { error: "Only employees can stop sessions" },
        { status: 403 }
      );
    }

    const employeeId = decoded.employeeId;
    const settings = await prisma.businessSettings.findFirst();

    if (!settings) throw new Error("Business settings not configured");

    const { timezone, closeTime } = settings;
    const now = new Date();

    // Fetch that specific session
    const session = await prisma.employeeSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.employeeId !== employeeId) {
      return NextResponse.json(
        { error: "Session does not belong to this employee" },
        { status: 403 }
      );
    }

    if (session.logoutAt) {
      return NextResponse.json(
        { error: "Session already closed" },
        { status: 400 }
      );
    }

    const loginAt = new Date(session.loginAt);

    // Determine local dates
    const localFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const loginLocalDay = localFormatter.format(loginAt);
    const nowLocalDay = localFormatter.format(now);

    let logoutAt;

    if (loginLocalDay !== nowLocalDay) {
      // Previous-day session → end at closing time of login day
      logoutAt = getCloseTimeUtcForLogin(loginAt, closeTime, timezone);
    } else {
      // Same day → end at current time
      logoutAt = now;
    }

    // Ensure correctness
    if (logoutAt < loginAt) {
      logoutAt = new Date(loginAt);
    }

    // Close session
    const updated = await prisma.employeeSession.update({
      where: { id: sessionId },
      data: { logoutAt },
    });

    return NextResponse.json({
      message: "Session stopped successfully",
      session: updated,
      logoutAt,
      type: loginLocalDay !== nowLocalDay ? "previous-day" : "same-day",
    });
  } catch (err) {
    console.error("🚨 Session STOP error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to stop session" },
      { status: 500 }
    );
  }
}

module.exports = { POST };
