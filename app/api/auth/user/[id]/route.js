const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { encryptPassword } = require("@/lib/encryption");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// ✅ GET user by ID
async function GET(req, { params }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "No token provided" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (decoded.userType !== "ADMIN" && decoded.id !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { employee: true, customer: true },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (err) {
    console.error("GET /api/auth/user/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// ✅ PUT update user
async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "No token provided" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { employee: true, customer: true },
    });
    if (!targetUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();

    // CUSTOMER updates
    if (targetUser.userType === "CUSTOMER") {
      if (decoded.id !== targetUser.id && decoded.userType !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      const {
        fullName,
        email,
        phone,
        password,
        vehicleJson,
        addressJson,
        notes,
      } = body;
      const userData = {};
      if (email) userData.email = email;
      if (phone) userData.phone = phone;
      if (password) userData.passwordEncrypted = encryptPassword(password);

      const updatedUser = await prisma.user.update({
        where: { id },
        data: userData,
      });
      await prisma.customerProfile.update({
        where: { userId: id },
        data: { fullName, vehicleJson, addressJson, notes },
      });

      return NextResponse.json({ message: "Customer updated", updatedUser });
    }

    // EMPLOYEE updates (Admin only)
    if (targetUser.userType === "EMPLOYEE") {
      if (decoded.userType !== "ADMIN") {
        return NextResponse.json(
          { error: "Only Admin can update Employee" },
          { status: 403 }
        );
      }
      const { fullName, email, phone, password, title, hourlyRate } = body;
      const userData = {};
      if (email) userData.email = email;
      if (phone) userData.phone = phone;
      if (password) userData.passwordEncrypted = encryptPassword(password);

      const updatedUser = await prisma.user.update({
        where: { id },
        data: userData,
      });
      await prisma.employeeProfile.update({
        where: { userId: id },
        data: { fullName, title, hourlyRate },
      });

      return NextResponse.json({ message: "Employee updated", updatedUser });
    }

    // ADMIN updates (Admin only)
    if (targetUser.userType === "ADMIN") {
      if (decoded.userType !== "ADMIN") {
        return NextResponse.json(
          { error: "Only Admin can update Admin" },
          { status: 403 }
        );
      }
      const { email, phone, password } = body;
      const userData = {};
      if (email) userData.email = email;
      if (phone) userData.phone = phone;
      if (password) userData.passwordEncrypted = encryptPassword(password);

      const updatedUser = await prisma.user.update({
        where: { id },
        data: userData,
      });
      return NextResponse.json({ message: "Admin updated", updatedUser });
    }

    return NextResponse.json(
      { error: "Unsupported user type" },
      { status: 400 }
    );
  } catch (err) {
    console.error("PUT /api/auth/user/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// ✅ DELETE user (soft delete)
async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "No token provided" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Admin can delete users" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.user.update({ where: { id }, data: { isActive: false } });

    return NextResponse.json({ message: "User deactivated successfully" });
  } catch (err) {
    console.error("DELETE /api/auth/user/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

module.exports = { GET, PUT, DELETE };
