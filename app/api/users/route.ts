export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/api-helpers";
import { hashPassword } from "@/lib/auth";

export async function GET(req: Request) {
  const { error } = await auth("ADMIN");
  if (error) return error;

  const url = new URL(req.url);
  const role = url.searchParams.get("role");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (role) where.role = role;

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      agentStatus: true,
      businessId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const { error } = await auth("ADMIN");
  if (error) return error;

  const data = await req.json();
  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role,
      locale: data.locale ?? "he",
      businessId: data.businessId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
