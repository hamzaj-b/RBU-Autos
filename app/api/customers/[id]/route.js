// app/api/customers/[id]/route.js
const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// ✅ Fetch single customer
async function GET(req, context) {
  try {
    const { id } = await context.params;

    const customer = await prisma.customerProfile.findUnique({
      where: { id },
      include: { User: true },
    });

    if (!customer)
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );

    return NextResponse.json({ customer });
  } catch (err) {
    console.error("Fetch customer error:", err);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

// ✅ Update customer
async function PUT(req, context) {
  try {
    const { id } = await context.params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "No token" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    const body = await req.json();
    const { fullName, addressJson, vehicleJson, notes, isActive } = body;

    // 🔹 1. Admin flow — can edit any customer fully
    if (decoded.userType === "ADMIN") {
      const updated = await prisma.customerProfile.update({
        where: { id },
        data: {
          fullName,
          addressJson,
          vehicleJson,
          notes,
          User: { updateMany: { data: { isActive: isActive ?? true } } },
        },
        include: { User: true },
      });

      return NextResponse.json({
        message: "Customer updated by Admin",
        customer: updated,
      });
    }

    // 🔹 2. Customer flow — can only edit their own record
    if (decoded.userType === "CUSTOMER") {
      if (decoded.customerId !== id) {
        return NextResponse.json(
          { error: "You can only update your own profile" },
          { status: 403 }
        );
      }

      const updated = await prisma.customerProfile.update({
        where: { id },
        data: {
          fullName,
          addressJson,
          vehicleJson,
          notes,
        },
        include: { User: true },
      });

      return NextResponse.json({
        message: "Profile updated successfully",
        customer: updated,
      });
    }

    // 🔹 3. Other roles (EMPLOYEE, etc.) — forbidden
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (err) {
    console.error("Update customer error:", err);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// ✅ Delete customer
async function DELETE(req, context) {
  try {
    const { id } = await context.params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "No token" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can delete customers" },
        { status: 403 }
      );
    }

    // Delete user & profile
    const profile = await prisma.customerProfile.findUnique({ where: { id } });
    if (!profile)
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );

    await prisma.user.deleteMany({ where: { customerProfileId: id } });
    await prisma.customerProfile.delete({ where: { id } });

    return NextResponse.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error("Delete customer error:", err);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}

module.exports = { GET, PUT, DELETE };
