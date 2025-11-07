import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    // Try to list one user from Firebase Auth
    const list = await adminAuth.listUsers(1);

    return Response.json({
      ok: true,
      totalUsers: list.users.length,
      firstUserUid: list.users[0]?.uid || "no users yet",
    });
  } catch (err) {
    console.error("❌ Firebase Admin Test Error:", err);
    return Response.json({
      ok: false,
      error: err.message,
    });
  }
}
