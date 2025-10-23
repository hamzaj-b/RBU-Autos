import { NextResponse } from "next/server";
import { PrismaClient, BookingStatus } from "@prisma/client";
import jwt from "jsonwebtoken";
import { DateTime } from "luxon";
import { pusherServer } from "@/lib/pusher";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

export async function POST(req) {
  try {
    // 🔐 Authenticate (Customer only)
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

    if (decoded.userType !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Only customers can create pre-bookings" },
        { status: 403 }
      );
    }

    const customerId = decoded.customerId;
    if (!customerId)
      return NextResponse.json(
        { error: "Customer ID missing in token" },
        { status: 400 }
      );

    // 📦 Parse request body
    const body = await req.json();
    const { serviceIds, startAt, notes } = body;

    if (!Array.isArray(serviceIds) || serviceIds.length === 0 || !startAt)
      return NextResponse.json(
        { error: "Missing required fields (serviceIds or startAt)" },
        { status: 400 }
      );

    const startTime = new Date(startAt);
    const now = new Date();
    if (isNaN(startTime.getTime()))
      return NextResponse.json(
        { error: "Invalid start time" },
        { status: 400 }
      );
    if (startTime <= now)
      return NextResponse.json(
        { error: "Pre-booking time must be in the future" },
        { status: 400 }
      );

    // ⚙️ Business Settings
    const business = await prisma.businessSettings.findFirst();
    if (!business)
      return NextResponse.json(
        { error: "Business settings not configured" },
        { status: 500 }
      );

    const { timezone, openTime, closeTime, allowCustomerBooking } = business;
    if (!allowCustomerBooking)
      return NextResponse.json(
        {
          error: "Online booking by customers is currently disabled.",
        },
        { status: 403 }
      );

    // 🧮 Get services
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true, durationMinutes: true, basePrice: true },
    });
    if (services.length !== serviceIds.length)
      return NextResponse.json(
        { error: "Invalid service IDs" },
        { status: 400 }
      );

    const totalDuration = services.reduce(
      (sum, s) => sum + (s.durationMinutes || 0),
      0
    );
    const endTime = new Date(startTime.getTime() + totalDuration * 60000);
    const totalPrice = services.reduce((sum, s) => sum + (s.basePrice || 0), 0);

    // 🕒 Validate hours
    const open = DateTime.fromFormat(openTime, "HH:mm", { zone: timezone });
    const close = DateTime.fromFormat(closeTime, "HH:mm", { zone: timezone });
    const bookingStart = DateTime.fromJSDate(startTime, { zone: timezone });
    const bookingEnd = DateTime.fromJSDate(endTime, { zone: timezone });

    const openMinutes = open.hour * 60 + open.minute;
    const closeMinutes = close.hour * 60 + close.minute;
    const startMinutes = bookingStart.hour * 60 + bookingStart.minute;
    const endMinutes = bookingEnd.hour * 60 + bookingEnd.minute;

    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      return NextResponse.json(
        {
          error: `Booking time (${bookingStart.toFormat(
            "HH:mm"
          )}–${bookingEnd.toFormat(
            "HH:mm"
          )}) exceeds working hours (${openTime}–${closeTime})`,
        },
        { status: 400 }
      );
    }

    // 🚫 Prevent overlap
    const overlap = await prisma.booking.findFirst({
      where: {
        customerId,
        bookingType: "PREBOOKING",
        startAt: { lt: endTime },
        endAt: { gt: startTime },
        status: { notIn: ["CANCELLED", "DONE"] },
      },
    });
    if (overlap)
      return NextResponse.json(
        { error: "You already have a booking in this time range" },
        { status: 400 }
      );

    // 💾 Transaction: Create booking
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          customerId,
          createdByUserId: decoded.id,
          date: startTime,
          startAt: startTime,
          endAt: endTime,
          slotMinutes: totalDuration,
          notes: notes || null,
          bookingType: "PREBOOKING",
          status: BookingStatus.PENDING,
        },
      });

      await tx.bookingService.createMany({
        data: serviceIds.map((serviceId) => ({
          bookingId: newBooking.id,
          serviceId,
        })),
      });

      return newBooking;
    });

    // 👤 Fetch customer + services for notification
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      select: { fullName: true, userId: true },
    });
    const customerName = customer?.fullName || "Unknown Customer";
    const serviceNames = services.map((s) => s.name);

    // ✅ 1️⃣ Pusher: Notify Admins in real-time
    await pusherServer.trigger("admin-channel", "new-booking", {
      message: "📅 New pre-booking created",
      booking,
      customerName,
      services: serviceNames,
    });

    // ✅ 2️⃣ Save Notifications (for Admin Panel only)
    const admins = await prisma.user.findMany({
      where: { userType: "ADMIN", isActive: true },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "New Pre-booking Created",
          message: `${customerName} booked ${serviceNames.join(", ")}.`,
          type: "NEW_BOOKING",
          metadata: {
            bookingId: booking.id,
            customerId,
            customerName,
            startAt: startTime,
            services: serviceNames,
          },
        })),
      });
    }

    console.log(
      `✅ Booking + Admin notifications stored: ${customerName} (${serviceNames.join(
        ", "
      )})`
    );

    return NextResponse.json(
      {
        message: "Pre-booking created successfully. Awaiting admin approval.",
        booking,
        summary: {
          totalDuration,
          totalPrice,
          startAt: startTime,
          endAt: endTime,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ Pre-booking creation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create pre-booking" },
      { status: 500 }
    );
  }
}
