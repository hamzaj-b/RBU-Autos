const { NextResponse } = require("next/server");
const { PrismaClient, WorkOrderStatus } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// -------------------------------------------
// 📜 GET — Fetch single Work Order by ID
// -------------------------------------------
async function GET(req, { params }) {
  try {
    // 🔑 Auth check
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

    const { id } = await params;
    if (!id)
      return NextResponse.json(
        { error: "WorkOrder ID is required" },
        { status: 400 }
      );

    // 🧭 Fetch WorkOrder with all relations
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            customer: true,
            bookingServices: { include: { service: true } },
          },
        },
        customer: true,
        employee: true,
        workOrderServices: { include: { service: true } },
      },
    });

    if (!workOrder)
      return NextResponse.json(
        { error: "WorkOrder not found" },
        { status: 404 }
      );

    // 🛡️ Role-based access control
    if (
      decoded.userType === "EMPLOYEE" &&
      workOrder.employeeId !== decoded.employeeId
    )
      return NextResponse.json(
        { error: "Unauthorized access to this work order" },
        { status: 403 }
      );

    if (
      decoded.userType === "CUSTOMER" &&
      workOrder.customerId !== decoded.customerId
    )
      return NextResponse.json(
        { error: "Unauthorized access to this work order" },
        { status: 403 }
      );

    // 🧾 Format response
    const formatted = {
      id: workOrder.id,
      status: workOrder.status,
      openedAt: workOrder.openedAt,
      closedAt: workOrder.closedAt,
      customerName: workOrder.customer?.fullName || "N/A",
      employeeName: workOrder.employee?.fullName || "Unassigned",
      services:
        workOrder.workOrderServices?.map((ws) => ws.service.name) ||
        workOrder.booking?.bookingServices?.map((bs) => bs.service.name) ||
        [],
      bookingTime: workOrder.booking
        ? `${new Date(
            workOrder.booking.startAt
          ).toLocaleTimeString()} - ${new Date(
            workOrder.booking.endAt
          ).toLocaleTimeString()}`
        : null,
      notes: workOrder.notes,
      raw: workOrder,
    };

    return NextResponse.json({ workOrder: formatted }, { status: 200 });
  } catch (err) {
    console.error("❌ Fetch WorkOrder by ID error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch WorkOrder" },
      { status: 500 }
    );
  }
}

module.exports = { GET };
