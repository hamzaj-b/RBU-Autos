import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

    // 🧠 Check if notification exists
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // 🗑️ Delete instead of updating (to reduce DB load)
    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully after being read",
    });
  } catch (error) {
    console.error("❌ Notification deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
