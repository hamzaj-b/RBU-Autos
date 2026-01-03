const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "No token provided" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    let decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Admin can assign employees" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { employeeId } = body;

    const booking = await prisma.booking.update({
      where: { id },
      data: { assignedEmployeeId: employeeId, status: "ACCEPTED" },
    });

    return NextResponse.json({ message: "Employee assigned", booking });
  } catch (err) {
    console.error("PUT /api/bookings/[id]/assign error:", err);
    return NextResponse.json(
      { error: "Failed to assign employee" },
      { status: 500 }
    );
  }
}

module.exports = { PUT };
