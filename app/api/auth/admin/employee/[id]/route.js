const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// 🟢 GET single employee
async function GET(req, context) {
  try {
    const { id } = await context.params;

    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "No token" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.userType !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // 🔹 Fetch employee with phone from linked User
    const employee = await prisma.employeeProfile.findUnique({
      where: { id },
      include: {
        Sessions: true,
        User: {
          select: {
            email: true,
            phone: true, // ✅ include phone
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!employee)
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );

    return NextResponse.json({ employee });
  } catch (err) {
    console.error("Fetch employee error:", err);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

// ✅ PUT: Update Employee (Admin only)
async function PUT(req, context) {
  try {
    const { id } = await context.params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "No token" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.userType !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await req.json();
    const { fullName, title, hourlyRate, phone, isActive } = body;

    // ✅ 1️⃣ Update employee profile fields
    const updatedEmployee = await prisma.employeeProfile.update({
      where: { id },
      data: { fullName, title, hourlyRate },
      include: { User: true },
    });

    // ✅ 2️⃣ Update linked user info (phone & active status)
    const userUpdateData = {};
    if (phone !== undefined) userUpdateData.phone = phone;
    if (isActive !== undefined) userUpdateData.isActive = isActive;

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.updateMany({
        where: { employeeProfileId: id },
        data: userUpdateData,
      });
    }

    // ✅ 3️⃣ Fetch updated record
    const refreshedEmployee = await prisma.employeeProfile.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Employee updated successfully",
      employee: refreshedEmployee,
    });
  } catch (err) {
    console.error("Update employee error:", err);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

// 🔴 DELETE employee
async function DELETE(req, context) {
  try {
    const { id } = await context.params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "No token" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.userType !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // 🧾 Verify employee exists
    const employee = await prisma.employeeProfile.findUnique({ where: { id } });
    if (!employee)
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );

    // Delete linked user first, then employee profile
    await prisma.user.deleteMany({ where: { employeeProfileId: id } });
    await prisma.employeeProfile.delete({ where: { id } });

    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Delete employee error:", err);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}

module.exports = { GET, PUT, DELETE };
