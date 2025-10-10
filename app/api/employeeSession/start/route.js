const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

function getUtcOffsetMs(utcStr) {
  let offsetStr = utcStr
    .replace(/^\(UTC/i, "")
    .replace(/\)$/, "")
    .trim();

  const match = offsetStr.match(/([+-])0*(\d{1,2}):0*(\d{1,2})/);
  if (!match) throw new Error(`Invalid UTC format: ${utcStr}`);
  const [, sign, hoursStr, minsStr] = match;
  const hours = parseInt(hoursStr, 10);
  const mins = parseInt(minsStr, 10);
  const totalMins = hours * 60 + mins;
  return totalMins * 60 * 1000 * (sign === "-" ? -1 : 1);
}

async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], SECRET_KEY);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (decoded.userType !== "EMPLOYEE") {
      return NextResponse.json(
        { error: "Only employees can start sessions" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { source = "web", location = "unknown" } = body;

    const settings = await prisma.businessSettings.findFirst();
    if (!settings) throw new Error("Business settings not configured");

    const { closeTime, timezone, utc } = settings;
    if (!closeTime || !timezone || !utc)
      throw new Error("Close time, timezone, or UTC not configured");

    const offsetMs = getUtcOffsetMs(utc);

    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
    const todayLocal = formatter.format(now);

    const existingSession = await prisma.employeeSession.findFirst({
      where: {
        employeeId: decoded.employeeId,
        OR: [{ logoutAt: { isSet: false } }, { logoutAt: null }],
      },
      orderBy: { loginAt: "desc" },
    });

    if (existingSession) {
      const loginDate = new Date(existingSession.loginAt);
      const loginLocalDay = formatter.format(loginDate);

      let logoutAt;

      if (loginLocalDay === todayLocal) {
        logoutAt = now;
      } else {
        const localIso = `${loginLocalDay}T${closeTime}:00Z`;
        const pretendUTC = new Date(localIso);
        const utcTimestamp = pretendUTC.getTime() - offsetMs;
        logoutAt = new Date(utcTimestamp);
      }

      await prisma.employeeSession.update({
        where: { id: existingSession.id },
        data: { logoutAt },
      });
    }

    const session = await prisma.employeeSession.create({
      data: {
        userId: decoded.id,
        employeeId: decoded.employeeId,
        loginAt: now,
        source,
        location,
      },
    });

    return NextResponse.json({
      message: "Employee session started successfully",
      session: {
        id: session.id,
        employeeId: session.employeeId,
        loginAt: session.loginAt,
        source: session.source,
        location: session.location,
      },
    });
  } catch (err) {
    console.error("Session start error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to start session" },
      { status: 500 }
    );
  }
}

module.exports = { POST };
