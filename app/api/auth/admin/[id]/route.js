const { NextResponse } = require("next/server");
const { PrismaClient, UserType } = require("@prisma/client");
const { encryptPassword } = require("@/lib/encryption");

const prisma = new PrismaClient();

// ✅ Get single admin
async function GET(req, { params }) {
  try {
    const { id } = params;
    const admin = await prisma.user.findFirst({
      where: { id, userType: UserType.ADMIN },
      select: {
        id: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!admin)
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    return NextResponse.json({ admin });
  } catch (err) {
    console.error("Get admin error:", err);
    return NextResponse.json(
      { error: "Failed to fetch admin" },
      { status: 500 }
    );
  }
}

// ✅ Update admin
async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { email, phone, password, isActive } = body;

    const data = {};
    if (email) data.email = email;
    if (phone) data.phone = phone;
    if (password) data.passwordEncrypted = encryptPassword(password);
    if (typeof isActive === "boolean") data.isActive = isActive;

    const updated = await prisma.user.updateMany({
      where: { id, userType: UserType.ADMIN },
      data,
    });

    if (updated.count === 0)
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    return NextResponse.json({ message: "Admin updated successfully" });
  } catch (err) {
    console.error("Update admin error:", err);
    return NextResponse.json(
      { error: "Failed to update admin" },
      { status: 500 }
    );
  }
}

// ✅ Delete admin
async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const deleted = await prisma.user.deleteMany({
      where: { id, userType: UserType.ADMIN },
    });

    if (deleted.count === 0)
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    return NextResponse.json({ message: "Admin deleted successfully" });
  } catch (err) {
    console.error("Delete admin error:", err);
    return NextResponse.json(
      { error: "Failed to delete admin" },
      { status: 500 }
    );
  }
}

module.exports = { GET, PUT, DELETE };
