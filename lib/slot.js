const { PrismaClient, BookingStatus } = require("@prisma/client");
const { DateTime } = require("luxon");

const prisma = new PrismaClient();

/**
 * Generate slots for a given date (UTC-based, globally consistent)
 * @param {string} date - "YYYY-MM-DD"
 * @returns {Promise<{slots: Array}>}
 */
async function getSlots(date) {
  // 1️⃣ Active employees
  const employees = await prisma.employeeProfile.findMany({
    where: { User: { some: { isActive: true } } },
    select: { id: true, fullName: true },
  });
  const employeeIds = employees.map((e) => e.id);

  if (employeeIds.length === 0) {
    return { slots: [], message: "No active employees" };
  }

  // 2️⃣ Business settings
  const settings = await prisma.businessSettings.findFirst();
  if (!settings) throw new Error("Business settings not configured");

  const { openTime, closeTime, slotMinutes } = settings;

  // 3️⃣ Build daily slot grid in pure UTC
  const startOfDay = DateTime.fromISO(`${date}T${openTime}`, { zone: "utc" });
  const endOfDay = DateTime.fromISO(`${date}T${closeTime}`, { zone: "utc" });

  const slots = [];
  let current = startOfDay;

  while (current < endOfDay) {
    const start = current.toUTC().toISO({ suppressMilliseconds: true });
    const end = current
      .plus({ minutes: slotMinutes })
      .toUTC()
      .toISO({ suppressMilliseconds: true });

    slots.push({
      start,
      end,
      capacity: employeeIds.length,
      availableEmployees: [...employeeIds],
      occupiedEmployees: [],
    });

    current = current.plus({ minutes: slotMinutes });
  }

  // 4️⃣ Fetch bookings overlapping the day (UTC window)
  const bookings = await prisma.booking.findMany({
    where: {
      startAt: { lt: endOfDay.toJSDate() },
      endAt: { gt: startOfDay.toJSDate() },
      status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] },
    },
    include: { workOrder: true },
  });

  // 5️⃣ Apply blocking rules (no timezone conversion)
  for (const booking of bookings) {
    for (const slot of slots) {
      const overlaps =
        booking.startAt < new Date(slot.end) &&
        booking.endAt > new Date(slot.start);

      if (overlaps) {
        if (booking.workOrder?.employeeId) {
          slot.availableEmployees = slot.availableEmployees.filter(
            (id) => id !== booking.workOrder.employeeId
          );
          slot.occupiedEmployees.push(booking.workOrder.employeeId);
        } else {
          slot.occupiedEmployees.push("UNASSIGNED_SLOT");
        }
      }
    }
  }

  // 6️⃣ Finalize capacity
  slots.forEach((slot) => {
    const unassignedCount = slot.occupiedEmployees.filter(
      (id) => id === "UNASSIGNED_SLOT"
    ).length;
    slot.capacity = Math.max(
      slot.availableEmployees.length - unassignedCount,
      0
    );
  });

  return { slots };
}

module.exports = { getSlots };
