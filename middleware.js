import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "supersecret"
);

// ✅ Role-based route access map
const roleAccess = {
  ADMIN: [
    "/",
    "/bookings",
    "/manage-bookings",
    "/pending-bookings",
    "/customers",
    "/staff-management",
    "/services",
    "/settings",
    "/work-order",
    "/diagnostics",
    "/repair-tracker",
    "/marketing",
    "/sessions",
    "/checkout",
    "/profile",
  ],

  EMPLOYEE: [
    "/dashboard",
    "/employee/repair-tracker",
    "/work-order",
    "/profile",
  ],

  CUSTOMER: ["/dashboard", "/my-bookings", "/preBooking", "/profile"],
};

export async function middleware(req) {
  const token = req.cookies.get("authToken")?.value;
  const { pathname } = req.nextUrl;

  // 🧩 Flatten all allowed paths to detect protected routes
  const allProtectedPaths = Array.from(
    new Set(Object.values(roleAccess).flat())
  );

  const isProtected = allProtectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // Allow public routes
  if (!isProtected) return NextResponse.next();

  // 🚫 No token → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  try {
    // ✅ Verify token
    const { payload } = await jwtVerify(token, SECRET);
    const userType = payload?.userType;

    if (!userType) {
      console.warn("No userType in token payload");
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // 🎯 Determine user’s allowed routes
    const allowedRoutes = roleAccess[userType] || [];

    const hasAccess = allowedRoutes.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    if (!hasAccess) {
      console.warn(`❌ Access denied for ${userType} → ${pathname}`);
      return NextResponse.redirect(new URL("/403", req.url));
    }

    // ✅ All good → allow
    return NextResponse.next();
  } catch (err) {
    console.error("Invalid or expired token:", err);
    const response = NextResponse.redirect(new URL("/auth/login", req.url));
    response.cookies.delete("authToken");
    return response;
  }
}

// ✅ Apply to all secured routes
export const config = {
  matcher: [
    "/",
    "/bookings/:path*",
    "/manage-bookings/:path*",
    "/pending-bookings/:path*",
    "/customers/:path*",
    "/staff-management/:path*",
    "/services/:path*",
    "/settings/:path*",
    "/work-order/:path*",
    "/marketing/:path*",
    "/diagnostics/:path*",
    "/repair-tracker/:path*",
    "/employee/:path*",
    "/my-bookings/:path*",
    "/preBooking/:path*",
    "/checkout/:path*",
    "/profile/:path*",
    "/dashboard/:path*",
  ],
};
