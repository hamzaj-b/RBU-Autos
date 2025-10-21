const { NextResponse } = require("next/server");
const {
  PrismaClient,
  WorkOrderStatus,
  BookingStatus,
} = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function PATCH(req, { params }) {
  try {
    // -------------------------
    // 🔑 1. Verify JWT Token
    // -------------------------
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], SECRET_KEY);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { id: workOrderId } = params;
    if (!workOrderId)
      return NextResponse.json(
        { error: "WorkOrder ID required" },
        { status: 400 }
      );

    // -------------------------
    // 🧾 2. Parse optional body fields
    // -------------------------
    const body = await req.json().catch(() => ({}));
    const note = body?.note?.trim?.() || "";
    const partsUsed = body?.partsUsed || [];
    const laborEntries = body?.laborEntries || [];
    const photos = body?.photos || null;

    // -------------------------
    // 🔍 3. Load WorkOrder + Booking
    // -------------------------
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        booking: true,
        workOrderServices: { include: { service: true } },
      },
    });

    if (!workOrder)
      return NextResponse.json(
        { error: "WorkOrder not found" },
        { status: 404 }
      );

    if (
      [WorkOrderStatus.DONE, WorkOrderStatus.CANCELLED].includes(
        workOrder.status
      )
    ) {
      return NextResponse.json(
        { error: `WorkOrder already ${workOrder.status.toLowerCase()}` },
        { status: 409 }
      );
    }

    // -------------------------
    // ⚖️ 4. Permission checks
    // -------------------------
    const isAdmin = decoded.userType === "ADMIN";
    const isEmployee = decoded.userType === "EMPLOYEE";

    if (!isAdmin && !isEmployee)
      return NextResponse.json(
        { error: "Only Admin or Employee can complete work orders" },
        { status: 403 }
      );

    if (isEmployee && workOrder.employeeId !== decoded.employeeId)
      return NextResponse.json(
        { error: "You are not authorized to complete this work order" },
        { status: 403 }
      );

    // -------------------------
    // 💰 5. Compute Additional Revenue
    // -------------------------
    // Expected structures:
    // partsUsed: [{ name, qty, price }]
    // laborEntries: [{ task, hours, rate }]
    let extraPartsTotal = 0;
    let extraLaborTotal = 0;

    if (Array.isArray(partsUsed)) {
      extraPartsTotal = partsUsed.reduce(
        (sum, p) => sum + (Number(p.price) || 0) * (Number(p.qty) || 1),
        0
      );
    }

    if (Array.isArray(laborEntries)) {
      extraLaborTotal = laborEntries.reduce(
        (sum, l) => sum + (Number(l.rate) || 0) * (Number(l.hours) || 1),
        0
      );
    }

    const extraTotal = extraPartsTotal + extraLaborTotal;
    const finalRevenue = (workOrder.totalRevenue || 0) + extraTotal;

    // -------------------------
    // 💾 6. Transaction: mark done + update booking + revenue
    // -------------------------
    const [updatedWorkOrder, updatedBooking] = await prisma.$transaction(
      async (tx) => {
        const updatedWO = await tx.workOrder.update({
          where: { id: workOrderId },
          data: {
            status: WorkOrderStatus.DONE,
            closedAt: new Date(),
            totalRevenue: finalRevenue, // 💰 update with added labor/parts
            partsUsed: partsUsed.length ? partsUsed : workOrder.partsUsed,
            laborEntries: laborEntries.length
              ? laborEntries
              : workOrder.laborEntries,
            photos: photos ? photos : workOrder.photos,
            notes:
              note.length > 0
                ? `${workOrder.notes || ""}${workOrder.notes ? "\n" : ""}${
                    isAdmin ? "[ADMIN-DONE]" : "[EMPLOYEE-DONE]"
                  } ${note}`
                : workOrder.notes ||
                  `[SYSTEM] Marked as completed by ${
                    isAdmin ? "Admin" : "Employee"
                  }`,
          },
        });

        const updatedBk = await tx.booking.update({
          where: { id: workOrder.bookingId },
          data: {
            status: BookingStatus.DONE,
            completedAt: new Date(),
          },
        });

        return [updatedWO, updatedBk];
      }
    );

    // -------------------------
    // ✅ 7. Success Response
    // -------------------------
    const msg = isAdmin
      ? "Work order completed by Admin successfully."
      : "Work order completed successfully.";

    return NextResponse.json(
      {
        message: msg,
        workOrder: updatedWorkOrder,
        booking: updatedBooking,
        revenueBreakdown: {
          previous: workOrder.totalRevenue || 0,
          extraPartsTotal,
          extraLaborTotal,
          finalRevenue,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Complete work order error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to complete work order" },
      { status: 500 }
    );
  }
}

module.exports = { PATCH };
