export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, jsonError } from "@/lib/api-helpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await auth("ADMIN", "CLIENT");
  if (error) return error;

  const { id } = await params;

  if (session!.role === "CLIENT" && session!.businessId !== id) {
    return jsonError("Forbidden", 403);
  }

  const business = await prisma.business.findUnique({
    where: { id },
    select: { minutesTotal: true, minutesUsed: true },
  });

  if (!business) return jsonError("Not found", 404);

  const remaining = business.minutesTotal - business.minutesUsed;
  const color =
    remaining > 50 ? "green" : remaining > 20 ? "orange" : remaining > 0 ? "red" : "depleted";

  return NextResponse.json({
    total: business.minutesTotal,
    used: business.minutesUsed,
    remaining,
    color,
  });
}

/** Admin: add minutes (with audit reason) */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await auth("ADMIN");
  if (error) return error;

  const { id } = await params;
  const { amount } = await req.json();

  if (!amount || typeof amount !== "number") {
    return jsonError("amount required", 400);
  }

  const business = await prisma.business.update({
    where: { id },
    data: { minutesTotal: { increment: amount } },
    select: { minutesTotal: true, minutesUsed: true },
  });

  return NextResponse.json({
    total: business.minutesTotal,
    used: business.minutesUsed,
    remaining: business.minutesTotal - business.minutesUsed,
  });
}
