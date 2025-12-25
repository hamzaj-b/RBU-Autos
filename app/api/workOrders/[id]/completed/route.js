const { NextResponse } = require("next/server");
const {
  PrismaClient,
  WorkOrderStatus,
  BookingStatus,
} = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

export async function PATCH(req, { params }) {
  try {
    // -------------------------
    // 🔑 1. Verify Admin Token
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

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Admin can mark work orders as COMPLETED" },
        { status: 403 }
      );
    }

    const { id: workOrderId } = await params;
    if (!workOrderId) {
      return NextResponse.json(
        { error: "WorkOrder ID required" },
        { status: 400 }
      );
    }

    // -------------------------
    // 🧾 2. Parse Body Fields
    // -------------------------
    const body = await req.json().catch(() => ({}));
    const note = body?.note?.trim?.() || "";
    const partsUsed = Array.isArray(body?.partsUsed) ? body.partsUsed : [];
    const laborEntries = Array.isArray(body?.laborEntries)
      ? body.laborEntries
      : [];
    const photos = body?.photos || null;
    const taxRate = Number(body?.taxRate) || 0; // 💰 from frontend (%)
    const taxAmount = Number(body?.taxAmount) || 0; // 💵 computed total

    // -------------------------
    // 🔍 3. Find Work Order
    // -------------------------
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        booking: true,
        workOrderServices: { include: { service: true } },
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "WorkOrder not found" },
        { status: 404 }
      );
    }

    if (
      [WorkOrderStatus.CANCELLED, WorkOrderStatus.COMPLETED].includes(
        workOrder.status
      )
    ) {
      return NextResponse.json(
        { error: `WorkOrder already ${workOrder.status.toLowerCase()}` },
        { status: 409 }
      );
    }

    // -------------------------
    // 💰 4. Compute Revenue (Labor + Parts only)
    // -------------------------
    const extraPartsTotal = partsUsed.reduce(
      (sum, p) => sum + (Number(p.price) || 0) * (Number(p.qty) || 1),
      0
    );

    const extraLaborTotal = laborEntries.reduce(
      (sum, l) => sum + (Number(l.rate) || 0) * (Number(l.hours) || 1),
      0
    );

    const subtotal = extraPartsTotal + extraLaborTotal;
    const appliedTax = taxAmount || (subtotal * taxRate) / 100;
    const finalRevenue = subtotal + appliedTax;

    // -------------------------
    // 💾 5. Transaction: Mark COMPLETED + Update Booking
    // -------------------------
    const [updatedWorkOrder, updatedBooking] = await prisma.$transaction(
      async (tx) => {
        const updatedWO = await tx.workOrder.update({
          where: { id: workOrderId },
          data: {
            status: WorkOrderStatus.COMPLETED,
            closedAt: new Date(),
            totalRevenue: finalRevenue, // ✅ labor + parts + tax
            taxRate: taxRate, // 💰 store tax percentage
            taxAmount: appliedTax, // 💵 store exact tax applied
            partsUsed: partsUsed.length ? partsUsed : workOrder.partsUsed,
            laborEntries: laborEntries.length
              ? laborEntries
              : workOrder.laborEntries,
            photos: photos || workOrder.photos,
            notes:
              note.length > 0
                ? `${workOrder.notes || ""}${
                    workOrder.notes ? "\n" : ""
                  }[ADMIN-COMPLETED] ${note}`
                : workOrder.notes || "[SYSTEM] Marked as COMPLETED by Admin",
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
    // ✅ 6. Success Response
    // -------------------------
    return NextResponse.json(
      {
        message: "✅ Work order marked as COMPLETED by Admin.",
        workOrder: updatedWorkOrder,
        booking: updatedBooking,
        revenueBreakdown: {
          partsTotal: extraPartsTotal,
          laborTotal: extraLaborTotal,
          subtotal,
          taxRate,
          taxAmount: appliedTax,
          finalRevenue,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Complete (Admin) Work Order Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to complete work order" },
      { status: 500 }
    );
  }
}
