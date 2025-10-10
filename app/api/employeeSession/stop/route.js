const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

function getTzOffsetMs(timeZone) {
  const tempDate = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(tempDate);
  const offsetPart = parts.find((part) => part.type === "timeZoneName");
  let offsetStr = offsetPart ? offsetPart.value : "+00:00";

  offsetStr = offsetStr.replace(/^GMT|UTC/i, "").trim();

  const match = offsetStr.match(/([+-])0*(\d{1,2})(?::0*(\d{1,2}))?/);
  if (!match) throw new Error(`Invalid offset format: ${offsetStr}`);
  const [, sign, hoursStr, minsStr] = match;
  const hours = parseInt(hoursStr, 10);
  const mins = minsStr ? parseInt(minsStr, 10) : 0;
  const totalMins = hours * 60 + mins;
  return totalMins * 60 * 1000 * (sign === "-" ? -1 : 1);
}

async function PUT(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], SECRET_KEY);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.userType !== "EMPLOYEE") {
      return NextResponse.json(
        { error: "Only employees can stop sessions" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const session = await prisma.employeeSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.employeeId !== decoded.employeeId) {
      return NextResponse.json(
        { error: "Unauthorized to stop this session" },
        { status: 403 }
      );
    }

    if (session.logoutAt) {
      return NextResponse.json(
        { message: "Session already closed", session },
        { status: 200 }
      );
    }

    const settings = await prisma.businessSettings.findFirst();
    if (!settings) throw new Error("Business settings not configured");

    const { closeTime, timezone } = settings;
    if (!closeTime || !timezone)
      throw new Error("Close time or timezone not configured");

    const offsetMs = getTzOffsetMs(timezone);

    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
    const loginLocalDay = formatter.format(new Date(session.loginAt));

    const localIso = `${loginLocalDay}T${closeTime}:00Z`;
    const pretendUTC = new Date(localIso);
    const utcTimestamp = pretendUTC.getTime() - offsetMs;
    const closeTimeDate = new Date(utcTimestamp);

    const now = new Date();
    const logoutAt = now > closeTimeDate ? closeTimeDate : now;

    const updatedSession = await prisma.employeeSession.update({
      where: { id: session.id },
      data: { logoutAt },
    });

    return NextResponse.json({
      message: "Employee session stopped successfully",
      session: updatedSession,
    });
  } catch (err) {
    console.error("Session stop error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to stop session" },
      { status: 500 }
    );
  }
}

module.exports = { PUT };
