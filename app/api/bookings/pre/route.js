import { NextResponse } from "next/server";
import { PrismaClient, BookingStatus } from "@prisma/client";
import jwt from "jsonwebtoken";
import { DateTime } from "luxon"; // for timezone-aware comparisons

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

export async function POST(req) {
  try {
    // 🔑 1️⃣ Authenticate (Customer only)
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

    // 📦 2️⃣ Parse Request Body
    const body = await req.json();
    const { serviceIds, startAt, notes } = body;

    if (!Array.isArray(serviceIds) || serviceIds.length === 0 || !startAt) {
      return NextResponse.json(
        { error: "Missing required fields (serviceIds or startAt)" },
        { status: 400 }
      );
    }

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

    // ⚙️ 3️⃣ Fetch Business Settings
    const business = await prisma.businessSettings.findFirst();
    if (!business)
      return NextResponse.json(
        { error: "Business settings not configured" },
        { status: 500 }
      );

    const { timezone, openTime, closeTime, allowCustomerBooking } = business;

    // ❌ Stop if customers not allowed
    if (!allowCustomerBooking) {
      return NextResponse.json(
        { error: "Online booking by customers is currently disabled." },
        { status: 403 }
      );
    }

    // 🧮 4️⃣ Get Service Info
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, durationMinutes: true, basePrice: true },
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

    // 🕒 5️⃣ Validate Against Garage Hours (using Luxon)
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

    // 🚫 6️⃣ Prevent Overlaps for Same Customer
    const overlap = await prisma.booking.findFirst({
      where: {
        customerId,
        bookingType: "PREBOOKING",
        startAt: { lt: endTime },
        endAt: { gt: startTime },
        status: { notIn: ["CANCELLED", "DONE"] },
      },
    });

    if (overlap) {
      return NextResponse.json(
        { error: "You already have a booking in this time range" },
        { status: 400 }
      );
    }

    // 💾 7️⃣ Create Booking Transaction
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

    // ✅ 8️⃣ Response
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
