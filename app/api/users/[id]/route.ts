export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, jsonError } from "@/lib/api-helpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await auth("ADMIN");
  if (error) return error;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      agentStatus: true,
      locale: true,
      businessId: true,
      createdAt: true,
    },
  });

  if (!user) return jsonError("Not found", 404);
  return NextResponse.json({ user });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await auth("ADMIN");
  if (error) return error;

  const { id } = await params;
  const data = await req.json();

  // Don't allow updating password hash directly
  delete data.passwordHash;

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      agentStatus: true,
      locale: true,
    },
  });

  return NextResponse.json({ user });
}
