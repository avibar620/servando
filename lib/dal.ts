import { getSession } from "./session";
import type { SessionPayload } from "./auth";
import type { Role } from "@prisma/client";

export type { SessionPayload };

/** Get current session or null */
export async function verifySession(): Promise<SessionPayload | null> {
  return getSession();
}

/** Get session or throw (for protected API routes) */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

/** Get session and verify role, or throw */
export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role as Role)) throw new Error("FORBIDDEN");
  return session;
}
