import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// GET /api/sessions/[id]
export async function GET(req, { params }) {
  try {
    const { id } = await params;
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

    // 🔒 Authorization check
    const isAdmin = decoded.userType === "ADMIN";
    const isSelf = decoded.employeeId === id;

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: "Access denied. You can only view your own sessions." },
        { status: 403 }
      );
    }

    // 📄 Query params for pagination/sorting
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;

    // 📦 Fetch sessions of the employee
    const [sessions, total] = await Promise.all([
      prisma.employeeSession.findMany({
        where: { employeeId: id },
        orderBy: { loginAt: order },
        skip,
        take: limit,
        select: {
          id: true,
          loginAt: true,
          logoutAt: true,
          source: true,
          location: true,
          latitude: true,
          longitude: true,
        },
      }),
      prisma.employeeSession.count({ where: { employeeId: id } }),
    ]);

    // 🕒 Add session duration
    const formatted = sessions.map((s) => {
      let duration = null;
      if (s.logoutAt) {
        const diff = new Date(s.logoutAt) - new Date(s.loginAt);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        duration = `${hours}h ${minutes}m`;
      } else {
        const diff = new Date() - new Date(s.loginAt);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        duration = `${hours}h ${minutes}m (active)`;
      }

      return { ...s, duration };
    });

    return NextResponse.json({
      sessions: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("❌ GET /api/sessions/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
