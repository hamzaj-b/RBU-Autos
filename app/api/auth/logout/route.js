const { NextResponse } = require("next/server");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");

    // No token? Still send success (logout must be idempotent)
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Logout successful" });
    }

    // Validate token (optional)
    const token = authHeader.split(" ")[1];
    try {
      jwt.verify(token, SECRET_KEY);
    } catch {
      // If token invalid/expired → still logout OK
      return NextResponse.json({ message: "Logout successful" });
    }

    // No DB work needed — client clears cookies itself
    return NextResponse.json({ message: "Logout successful" });
  } catch (err) {
    console.error("Logout API error:", err);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}

module.exports = { POST };
