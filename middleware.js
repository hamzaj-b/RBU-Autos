import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Use the same secret you used for signing JWTs in your API
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "supersecret"
);

export async function middleware(req) {
  const token = req.cookies.get("authToken")?.value;

  // ✅ Define which routes should be protected
  const protectedPaths = [
    "/", // root path
    "/dashboard",
    "/bookings",
    "/customers",
    "/staff-management",
    "/work-order",
    "/diagnostics",
    "/repair-tracker",
  ];

  const { pathname } = req.nextUrl;

  // Check if current route needs protection
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // If not a protected route → allow access
  if (!isProtected) return NextResponse.next();

  // If no token → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Verify JWT token
  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next(); // ✅ Token valid → continue
  } catch (err) {
    console.error("Invalid or expired token:", err);
    const response = NextResponse.redirect(new URL("/auth/signin", req.url));
    response.cookies.delete("authToken"); // clear bad token
    return response;
  }
}

// ✅ Configure which routes middleware applies to
export const config = {
  matcher: [
    "/", // Protect root
    "/dashboard/:path*",
    "/bookings/:path*",
    "/customers/:path*",
    "/staff-management/:path*",
    "/work-order/:path*",
    "/diagnostics/:path*",
    "/repair-tracker/:path*",
  ],
};
