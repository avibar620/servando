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
    include: { plan: true },
  });

  if (!business) return jsonError("Not found", 404);
  return NextResponse.json({ business });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await auth("ADMIN");
  if (error) return error;

  const { id } = await params;
  const data = await req.json();

  const business = await prisma.business.update({
    where: { id },
    data,
    include: { plan: true },
  });

  return NextResponse.json({ business });
}
