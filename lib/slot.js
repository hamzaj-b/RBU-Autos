const { PrismaClient, BookingStatus } = require("@prisma/client");
const { DateTime } = require("luxon");

const prisma = new PrismaClient();

/**
 * Generate slots for a given date with availability.
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<{slots: Array}>}
 */
async function getSlots(date) {
  // 1. Active employees
  const employees = await prisma.employeeProfile.findMany({
    where: { User: { some: { isActive: true } } },
    select: { id: true, fullName: true },
  });
  const employeeIds = employees.map((e) => e.id);

  if (employeeIds.length === 0) {
    return { slots: [], message: "No active employees" };
  }

  // 2. Business settings
  const settings = await prisma.businessSettings.findFirst();
  if (!settings) {
    throw new Error("Business settings not configured");
  }

  const { openTime, closeTime, slotMinutes } = settings;

  // 3. Build slots grid (UTC)
  const startOfDay = DateTime.fromISO(`${date}T${openTime}`, { zone: "utc" });
  const endOfDay = DateTime.fromISO(`${date}T${closeTime}`, { zone: "utc" });

  let current = startOfDay;
  const slots = [];

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

  // 4. Fetch bookings for the day
  const bookings = await prisma.booking.findMany({
    where: {
      date: {
        gte: startOfDay.toJSDate(),
        lt: endOfDay.toJSDate(),
      },
      status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] },
    },
    include: { workOrder: true },
  });

  // 5. Apply blocking rules
  for (const booking of bookings) {
    slots.forEach((slot) => {
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
    });
  }

  // 6. Finalize slot capacity
  slots.forEach((slot) => {
    const openReservations = slot.occupiedEmployees.filter(
      (id) => id === "UNASSIGNED_SLOT"
    ).length;
    slot.capacity = Math.max(
      slot.availableEmployees.length - openReservations,
      0
    );
  });

  return { slots };
}

module.exports = { getSlots };
