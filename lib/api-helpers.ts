import { NextResponse } from "next/server";
import { getSession } from "./session";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";

/** Verify session and role, return session or error response */
export async function auth(...allowedRoles: Role[]) {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(session.role as Role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

/** Atomically increment a counter and return the new display ID */
export async function nextDisplayId(
  type: "ticket_referred" | "ticket_internal" | "call" | "transaction"
): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { id: type },
    update: { value: { increment: 1 } },
    create: { id: type, value: 1 },
  });

  const val = counter.value;
  const padded = String(val).padStart(4, "0");

  switch (type) {
    case "ticket_referred":
      return `#${padded}`;
    case "ticket_internal":
      return `K${padded}`;
    case "call":
      return `C-${padded}`;
    case "transaction":
      return `TXN-${padded}`;
  }
}

/** Standard JSON error response */
export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
