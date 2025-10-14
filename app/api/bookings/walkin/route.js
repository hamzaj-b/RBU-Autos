import { NextResponse } from "next/server";
import { PrismaClient, BookingStatus, WorkOrderStatus } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

export async function POST(req) {
  try {
    // 🔑 1️⃣ AUTH CHECK (Admin only)
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
        { error: "Only Admins can create walk-in bookings." },
        { status: 403 }
      );
    }

    // 📦 2️⃣ Extract & validate input
    const body = await req.json();
    const { customerId, serviceIds, directAssignEmployeeId, notes } = body;

    if (!customerId || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: customerId, serviceIds" },
        { status: 400 }
      );
    }

    // 🧮 3️⃣ Calculate total duration from services
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { durationMinutes: true },
    });

    if (!services.length) {
      return NextResponse.json(
        { error: "Invalid serviceIds: no matching services found" },
        { status: 400 }
      );
    }

    const totalDuration = services.reduce(
      (sum, s) => sum + (s.durationMinutes || 0),
      0
    );

    const now = new Date();
    const startAt = now;
    const endAt = new Date(now.getTime() + totalDuration * 60 * 1000);

    // 🧠 4️⃣ Determine employee availability (Hybrid logic)
    let workOrderStatus = WorkOrderStatus.OPEN;
    let employeeAvailable = true;
    let conflict = null;

    if (directAssignEmployeeId) {
      const overlap = await prisma.workOrder.findFirst({
        where: {
          employeeId: directAssignEmployeeId,
          status: { in: ["ASSIGNED", "IN_PROGRESS", "WAITING"] },
          booking: {
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          },
        },
        include: { booking: true },
      });

      if (overlap) {
        employeeAvailable = false;
        conflict = overlap;
        workOrderStatus = WorkOrderStatus.WAITING; // add to waiting queue
      } else {
        workOrderStatus = WorkOrderStatus.ASSIGNED; // assign instantly
      }
    }

    // 🔒 5️⃣ Create booking + workOrder transactionally
    const [booking, workOrder] = await prisma.$transaction(async (tx) => {
      // ➕ Create booking
      const booking = await tx.booking.create({
        data: {
          customerId,
          createdByUserId: decoded.id,
          date: startAt,
          startAt,
          endAt,
          slotMinutes: totalDuration,
          bookingType: "WALKIN",
          notes: notes || null,
          status: BookingStatus.ACCEPTED,
        },
      });

      // ➕ Link booking → services
      await tx.bookingService.createMany({
        data: serviceIds.map((sid) => ({
          bookingId: booking.id,
          serviceId: sid,
        })),
      });

      // ➕ Create workOrder
      const workOrder = await tx.workOrder.create({
        data: {
          bookingId: booking.id,
          customerId,
          employeeId: directAssignEmployeeId || null,
          status: workOrderStatus,
        },
      });

      // ➕ Link workOrder → services
      await tx.workOrderService.createMany({
        data: serviceIds.map((sid) => ({
          workOrderId: workOrder.id,
          serviceId: sid,
        })),
      });

      // 🔗 Update booking with workOrder relation
      await tx.booking.update({
        where: { id: booking.id },
        data: { workOrder: { connect: { id: workOrder.id } } },
      });

      return [booking, workOrder];
    });

    // 🧩 6️⃣ Compose final message
    let message = "";
    if (!directAssignEmployeeId) {
      message =
        "Walk-in booking created successfully and added to the open work orders queue.";
    } else if (employeeAvailable) {
      message =
        "Walk-in booking created and assigned to employee successfully.";
    } else {
      message =
        "Employee is currently busy. Booking added to the waiting queue and will be auto-assigned when available.";
    }

    // ✅ 7️⃣ Send success response
    return NextResponse.json(
      {
        message,
        booking,
        workOrder,
        conflict: conflict
          ? {
              employeeId: directAssignEmployeeId,
              existingBookingId: conflict.bookingId,
              busyUntil: conflict.booking.endAt,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ Walk-in Booking Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create walk-in booking" },
      { status: 500 }
    );
  }
}
