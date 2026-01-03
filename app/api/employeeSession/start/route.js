const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

/**
 * Correctly converts the garage's closing time (local) → UTC Date
 * for the same local date as loginAt.
 */
function getCloseTimeUtcForLogin(loginAt, closeTime, timezone) {
  // 1️⃣ Extract local date string for the login day
  const localFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const localDateStr = localFormatter.format(loginAt); // e.g. "2025-10-23"

  // 2️⃣ Construct local datetime string
  const localDateTimeStr = `${localDateStr}T${closeTime}:00`;

  // 3️⃣ Create Date object representing that local time
  const localDate = new Date(localDateTimeStr);

  // 4️⃣ Convert local time → UTC correctly
  const tzShifted = new Date(
    localDate.toLocaleString("en-US", { timeZone: timezone })
  );
  const offsetMinutes = (tzShifted.getTime() - localDate.getTime()) / 60000;
  const utcDate = new Date(localDate.getTime() + offsetMinutes * 60000);

  // console.log("🔹 [getCloseTimeUtcForLogin]");
  // console.log("Local Date:", localDateStr);
  // console.log("Local CloseTime:", closeTime);
  // console.log("Offset (min):", offsetMinutes);
  // console.log("→ Computed UTC CloseTime:", utcDate.toISOString());

  return utcDate;
}

async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(authHeader.split(" ")[1], SECRET_KEY);
    if (decoded.userType !== "EMPLOYEE") {
      return NextResponse.json(
        { error: "Only employees can start sessions" },
        { status: 403 }
      );
    }

    // 🧠 Parse request body (accepts source + location + lat/lng)
    const body = await req.json().catch(() => ({}));
    const source = body.source || "web";
    const location = body.location || "unknown";
    const latitude = body.latitude || null;
    const longitude = body.longitude || null;

    // 🕒 Fetch business settings
    const settings = await prisma.businessSettings.findFirst();
    if (!settings) throw new Error("Business settings not configured");

    const { timezone, closeTime } = settings;
    const now = new Date();

    // console.log("🕓 Current UTC Now:", now.toISOString());
    // console.log("🌍 Business Timezone:", timezone);
    // console.log("🏁 Garage CloseTime:", closeTime);

    // 🔍 Find any open session
    const existingSession = await prisma.employeeSession.findFirst({
      where: {
        employeeId: decoded.employeeId,
        OR: [{ logoutAt: null }, { logoutAt: { isSet: false } }],
      },
      orderBy: { loginAt: "desc" },
    });

    if (existingSession) {
      const loginAt = new Date(existingSession.loginAt);

      const localFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const loginLocalDay = localFormatter.format(loginAt);
      const nowLocalDay = localFormatter.format(now);

      // console.log("📅 Login Local Day:", loginLocalDay);
      // console.log("📅 Now Local Day:", nowLocalDay);

      let logoutAt;

      if (loginLocalDay !== nowLocalDay) {
        // 🕒 Previous-day session → close at that day's garage close time
        logoutAt = getCloseTimeUtcForLogin(loginAt, closeTime, timezone);
        // console.log(
        //   `💤 Previous-day session found. Closing at garage close time (${logoutAt.toISOString()})`
        // );
      } else {
        // 🕕 Same-day session → close now
        logoutAt = now;
        // console.log(
        //   `🕒 Same-day session found. Closing now (${logoutAt.toISOString()})`
        // );
      }

      // Ensure logoutAt >= loginAt
      if (logoutAt < loginAt) {
        console.warn("⚠️ Adjusting logoutAt to not precede loginAt");
        logoutAt = loginAt;
      }

      // ✅ Update the previous session
      await prisma.employeeSession.update({
        where: { id: existingSession.id },
        data: { logoutAt },
      });

      // console.log(`✅ Closed previous session at ${logoutAt.toISOString()}`);
    }

    // 💾 Create new session
    const session = await prisma.employeeSession.create({
      data: {
        userId: decoded.id,
        employeeId: decoded.employeeId,
        loginAt: now,
        source,
        location,
        latitude,
        longitude,
      },
    });

    // console.log(`✅ New session started at ${now.toISOString()}`);

    return NextResponse.json({
      message: "Employee session started successfully",
      session,
    });
  } catch (err) {
    console.error("🚨 Session start error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to start session" },
      { status: 500 }
    );
  }
}

module.exports = { POST };
