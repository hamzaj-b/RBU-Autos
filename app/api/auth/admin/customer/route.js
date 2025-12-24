const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// ============================
// ROUTE
// ============================
async function POST(req) {
  let createdUserId = null;

  try {
    const { token, fullName, phone } = await req.json();

    // ============================
    // VALIDATION
    // ============================
    if (!token || !fullName || !phone) {
      return NextResponse.json(
        { error: "token, fullName and phone are required." },
        { status: 400 }
      );
    }

    // ============================
    // VERIFY ADMIN TOKEN
    // ============================
    const decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ============================
    // CHECK EXISTING USER (PHONE)
    // ============================
    const existing = await prisma.user.findFirst({
      where: { phone },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User with this phone already exists" },
        { status: 400 }
      );
    }

    // ============================
    // CREATE USER + PROFILE
    // ============================
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone,
          email: null, // no email required
          userType: "CUSTOMER",
          passwordEncrypted: null,
          isActive: true,
        },
      });

      const profile = await tx.customerProfile.create({
        data: {
          userId: user.id,
          fullName,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { customerProfileId: profile.id },
      });

      createdUserId = user.id;

      return { user, profile };
    });

    return NextResponse.json({
      message: "Customer added successfully",
      user: result.user,
      profile: result.profile,
    });
  } catch (err) {
    console.error("Add customer error:", err);

    // ============================
    // ROLLBACK SAFETY
    // ============================
    if (createdUserId) {
      try {
        await prisma.customerProfile.deleteMany({
          where: { userId: createdUserId },
        });
        await prisma.user.delete({
          where: { id: createdUserId },
        });
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }
    }

    return NextResponse.json(
      {
        error: "Failed to add customer",
        details: err.message,
      },
      { status: 500 }
    );
  }
}

module.exports = { POST };
