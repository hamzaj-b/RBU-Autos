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
    const { fullName, phone, addressJson, vehicleJson, notes, isActive } = body;

    // 🔹 1. Admin flow — can edit any customer fully (including phone)
    if (decoded.userType === "ADMIN") {
      const updated = await prisma.customerProfile.update({
        where: { id },
        data: {
          fullName,
          addressJson:
            typeof addressJson === "string"
              ? { raw: addressJson }
              : addressJson || {},
          vehicleJson:
            typeof vehicleJson === "string"
              ? { raw: vehicleJson }
              : vehicleJson || {},
          notes,
          User: {
            updateMany: {
              where: { customerProfileId: id },
              data: {
                isActive: isActive ?? true,
                ...(phone ? { phone } : {}), // ✅ update phone if provided
              },
            },
          },
        },
        include: {
          User: {
            select: {
              id: true,
              email: true,
              phone: true,
              isActive: true,
              userType: true,
            },
          },
        },
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
          addressJson:
            typeof addressJson === "string"
              ? { raw: addressJson }
              : addressJson || {},
          vehicleJson:
            typeof vehicleJson === "string"
              ? { raw: vehicleJson }
              : vehicleJson || {},
          notes,
        },
        include: {
          User: {
            select: {
              id: true,
              email: true,
              phone: true,
              isActive: true,
              userType: true,
            },
          },
        },
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
    if (!authHeader) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can delete customers" },
        { status: 403 }
      );
    }

    const profile = await prisma.customerProfile.findUnique({ where: { id } });
    if (!profile) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // ✅ check dependencies
    const [bookingsCount, workOrdersCount] = await Promise.all([
      prisma.booking.count({ where: { customerId: id } }), // Booking uses customerId
      prisma.workOrder.count({ where: { customerId: id } }), // adjust if your field differs
    ]);

    if (bookingsCount > 0 || workOrdersCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete this customer because they have existing bookings or work orders.",
          details: {
            bookingsCount,
            workOrdersCount,
          },
          hint: "Delete/close the related bookings/work orders first, or deactivate the customer instead.",
        },
        { status: 400 }
      );
    }

    // ✅ transaction: delete profile first, then user
    await prisma.$transaction(async (tx) => {
      await tx.customerProfile.delete({ where: { id } });
      await tx.user.deleteMany({ where: { customerProfileId: id } });
    });

    return NextResponse.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error("Delete customer error:", err);

    // ✅ if Prisma still blocks due to required relations, return a friendly message
    if (err?.code === "P2014") {
      return NextResponse.json(
        {
          error:
            "Cannot delete this customer because they have related records (bookings/work orders).",
          details: err?.meta || err?.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete customer", details: err.message },
      { status: 500 }
    );
  }
}

module.exports = { GET, PUT, DELETE };
