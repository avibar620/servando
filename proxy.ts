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

// Home screen per role
const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  AGENT: "/agent",
  CLIENT: "/portal",
};

function getLocale(pathname: string): string {
  return pathname.match(/^\/(he|en|nl)\//)?.[1] ?? "he";
}

function loginUrl(locale: string): string {
  return locale === "he" ? "/" : `/${locale}`;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes — skip intl middleware entirely
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Static files and Next.js internals
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Login page — if already logged in, redirect to home screen
  if (pathname === "/" || pathname.match(/^\/(he|en|nl)?$/)) {
    const token = request.cookies.get("session")?.value;
    if (token) {
      const session = await verifyToken(token);
      if (session) {
        const locale = getLocale(pathname);
        const home = ROLE_HOME[session.role] ?? "/";
        const prefix = locale === "he" ? "" : `/${locale}`;
        return NextResponse.redirect(new URL(`${prefix}${home}`, request.url));
      }
    }
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
    return NextResponse.redirect(new URL(loginUrl(getLocale(pathname)), request.url));
  }

  const session = await verifyToken(token);
  if (!session) {
    return NextResponse.redirect(new URL(loginUrl(getLocale(pathname)), request.url));
  }

  // Wrong role — redirect to correct home screen instead of login
  if (!match.roles.includes(session.role)) {
    const locale = getLocale(pathname);
    const home = ROLE_HOME[session.role] ?? "/";
    const prefix = locale === "he" ? "" : `/${locale}`;
    return NextResponse.redirect(new URL(`${prefix}${home}`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
