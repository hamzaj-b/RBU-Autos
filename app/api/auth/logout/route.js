const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

/**
 * Correctly converts the garage's closing time (local) → UTC Date
 * for the same local date as loginAt.
 */
/**
 * Return UTC Date of garage closing time for the same local day as loginAt.
 * Works for all positive/negative offsets (e.g., US/Eastern = -300).
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

  // 1️⃣ Create a local "wall clock" date
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
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(authHeader.split(" ")[1], SECRET_KEY);
    if (decoded.userType !== "EMPLOYEE") {
      return NextResponse.json({ message: "Logout successful" });
    }

    const settings = await prisma.businessSettings.findFirst();
    if (!settings) throw new Error("Business settings not configured");

    const { timezone, closeTime } = settings;
    const now = new Date();

    // console.log("🕓 Current UTC Now:", now.toISOString());
    // console.log("🌍 Business Timezone:", timezone);
    // console.log("🏁 Garage CloseTime:", closeTime);

    // Find any open session
    const existingSession = await prisma.employeeSession.findFirst({
      where: {
        employeeId: decoded.employeeId,
        OR: [{ logoutAt: null }, { logoutAt: { isSet: false } }],
      },
      orderBy: { loginAt: "desc" },
    });

    if (!existingSession) {
      console.warn(
        `⚠️ No active session found for employee ${decoded.employeeId}`
      );
      return NextResponse.json({ message: "No open session found" });
    }

    const loginAt = new Date(existingSession.loginAt);
    // console.log("🟩 Found Open Session:");
    // console.log("LoginAt (UTC):", loginAt.toISOString());

    // Compare login local day vs now local day
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
      // 🔹 Case 1: Previous-day session
      logoutAt = getCloseTimeUtcForLogin(loginAt, closeTime, timezone);
      // console.log("💤 Previous-day session detected.");
    } else {
      // 🔹 Case 2: Same-day session
      logoutAt = now;
      // console.log("🕒 Same-day session detected.");
    }

    // Ensure logoutAt ≥ loginAt
    if (logoutAt < loginAt) {
      console.warn("⚠️ logoutAt earlier than loginAt, adjusting...");
      logoutAt = new Date(loginAt);
    }

    // ✅ Update DB
    await prisma.employeeSession.update({
      where: { id: existingSession.id },
      data: { logoutAt },
    });

    // console.log("✅ Session Updated!");
    // console.log("Final LogoutAt (UTC):", logoutAt.toISOString());

    return NextResponse.json({
      message: "Logout successful",
      logoutAt,
      type: loginLocalDay !== nowLocalDay ? "previous-day" : "same-day",
    });
  } catch (err) {
    console.error("🚨 Logout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to logout" },
      { status: 500 }
    );
  }
}

module.exports = { POST };
