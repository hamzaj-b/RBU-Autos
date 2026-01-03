// app/api/customers/route.js
const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// ✅ Create new customer (without sending password email)
async function POST(req) {
  try {
    // ============================
    // AUTH
    // ============================
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can create customers" },
        { status: 403 }
      );
    }

    // ============================
    // BODY
    // ============================
    const body = await req.json();
    const { email, phone, fullName, addressJson, vehicleJson, notes } = body;

    if (!fullName || fullName.trim() === "") {
      return NextResponse.json(
        { error: "fullName is required" },
        { status: 400 }
      );
    }

    // ============================
    // CHECK EXISTING (EMAIL ONLY IF PRESENT)
    // ============================
    const orConditions = [];

    if (email && email.trim() !== "") {
      orConditions.push({ email: email.trim().toLowerCase() });
    }

    if (phone && phone.trim() !== "") {
      orConditions.push({ phone: phone.trim() });
    }

    if (orConditions.length > 0) {
      const existing = await prisma.user.findFirst({
        where: { OR: orConditions },
      });

      if (existing) {
        return NextResponse.json(
          { error: "User with this email or phone already exists" },
          { status: 400 }
        );
      }
    }

    // ============================
    // CREATE USER (EMAIL OMITTED IF EMPTY)
    // ============================
    const userData = {
      phone: phone && phone.trim() !== "" ? phone.trim() : undefined,
      userType: "CUSTOMER",
      passwordEncrypted: null,
      isActive: true,
    };

    // ONLY add email if it exists
    if (email && email.trim() !== "") {
      userData.email = email.trim().toLowerCase();
    }

    const user = await prisma.user.create({
      data: userData,
    });

    // ============================
    // CREATE PROFILE
    // ============================
    const profile = await prisma.customerProfile.create({
      data: {
        userId: user.id,
        fullName: fullName.trim(),
        addressJson: addressJson || {},
        vehicleJson: vehicleJson || {},
        notes: notes || null,
      },
    });

    // ============================
    // LINK
    // ============================
    await prisma.user.update({
      where: { id: user.id },
      data: { customerProfileId: profile.id },
    });

    return NextResponse.json(
      {
        message: "Customer created successfully",
        user,
        profile,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create customer error:", err);

    // Unique constraint safety
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "User with this email or phone already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
// ✅ Fetch all customers
async function GET(req) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);

    const search = params.search || "";
    const page = Number(params.page || 1);

    // ✅ allow "all"
    const limitParam = params.limit ?? "10";
    const isAll = String(limitParam).toLowerCase() === "all";
    const limit = isAll ? null : Number(limitParam || 10);

    // ✅ only calculate skip if not all
    const skip = !isAll ? (page - 1) * limit : 0;

    // 🔥 Normalize phone search (remove spaces, + , - etc)
    const cleanSearch = search ? search.replace(/\D/g, "") : null;

    // 🔍 Dynamic search conditions
    const where = search
      ? {
          OR: [
            // Name search
            { fullName: { contains: search, mode: "insensitive" } },

            // Email search
            {
              User: {
                some: {
                  email: { contains: search, mode: "insensitive" },
                },
              },
            },

            // Phone search (normalized)
            cleanSearch
              ? {
                  User: {
                    some: {
                      phone: {
                        contains: cleanSearch,
                      },
                    },
                  },
                }
              : undefined,
          ].filter(Boolean),
        }
      : {};

    const total = await prisma.customerProfile.count({ where });

    const customers = await prisma.customerProfile.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            email: true,
            phone: true,
            isActive: true,
            userType: true,
          },
        },
      },
      ...(isAll ? {} : { skip: Number(skip), take: Number(limit) }),
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      total,
      page: isAll ? 1 : Number(page),
      limit: isAll ? "all" : Number(limit),
      totalPages: isAll ? 1 : Math.ceil(total / limit),
      customers,
    });
  } catch (err) {
    console.error("Fetch customers error:", err);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

module.exports = { POST, GET };
