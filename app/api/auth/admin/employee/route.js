const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const { encryptPassword } = require("@/lib/encryption");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function POST(req) {
  try {
    const body = await req.json();
    const { token, email, password, fullName, title, hourlyRate } = body;

    // verify admin token
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
      if (decoded.userType !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // check if exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const encrypted = encryptPassword(password);

    // Step 1: create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordEncrypted: encrypted,
        userType: "EMPLOYEE",
      },
    });

    // Step 2: create employee profile linked to userId
    const profile = await prisma.employeeProfile.create({
      data: {
        userId: user.id,
        fullName,
        title,
        hourlyRate,
      },
    });

    // Step 3: update user to connect employeeProfileId
    await prisma.user.update({
      where: { id: user.id },
      data: { employeeProfileId: profile.id },
    });

    return NextResponse.json({ message: "Employee created", user, profile });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}

async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "No token" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const employees = await prisma.employeeProfile.findMany({
      include: {
        Sessions: true,
        User: {
          select: { email: true, isActive: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ employees });
  } catch (err) {
    console.error("Fetch employees error:", err);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

module.exports = { POST, GET };
