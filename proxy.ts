import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { verifyToken } from "./lib/auth";

const intlMiddleware = createMiddleware(routing);

// Routes that require authentication and their allowed roles
const PROTECTED: { pattern: RegExp; roles: string[] }[] = [
  { pattern: /\/admin/, roles: ["ADMIN"] },
  { pattern: /\/agent/, roles: ["ADMIN", "AGENT"] },
  { pattern: /\/missed-calls/, roles: ["ADMIN", "AGENT"] },
  { pattern: /\/feedback/, roles: ["ADMIN", "AGENT"] },
  { pattern: /\/tickets/, roles: ["ADMIN", "AGENT"] },
  { pattern: /\/bi/, roles: ["ADMIN"] },
  { pattern: /\/portal/, roles: ["CLIENT"] },
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for login page, API routes, static files
  if (
    pathname === "/" ||
    pathname.match(/^\/(he|en|nl)?$/) ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return intlMiddleware(request);
  }

  // Check if this route is protected
  const match = PROTECTED.find((r) => r.pattern.test(pathname));
  if (!match) {
    return intlMiddleware(request);
  }

  // Verify session
  const token = request.cookies.get("session")?.value;
  if (!token) {
    // Redirect to login
    const locale = pathname.match(/^\/(he|en|nl)\//)?.[1] ?? "he";
    return NextResponse.redirect(new URL(`/${locale === "he" ? "" : locale}`, request.url));
  }

  const session = await verifyToken(token);
  if (!session) {
    const locale = pathname.match(/^\/(he|en|nl)\//)?.[1] ?? "he";
    return NextResponse.redirect(new URL(`/${locale === "he" ? "" : locale}`, request.url));
  }

  // Check role
  if (!match.roles.includes(session.role)) {
    const locale = pathname.match(/^\/(he|en|nl)\//)?.[1] ?? "he";
    return NextResponse.redirect(new URL(`/${locale === "he" ? "" : locale}`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
