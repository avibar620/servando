import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const { error } = await auth("ADMIN");
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("q");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { ownerName: { contains: search, mode: "insensitive" } },
    ];
  }

  const businesses = await prisma.business.findMany({
    where,
    include: { plan: true },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json({ businesses });
}

export async function POST(req: Request) {
  const { error } = await auth("ADMIN");
  if (error) return error;

  const data = await req.json();

  const business = await prisma.business.create({
    data: {
      name: data.name,
      ownerName: data.ownerName,
      phone: data.phone,
      email: data.email,
      address: data.address,
      website: data.website,
      category: data.category,
      description: data.description,
      planId: data.planId,
      minutesTotal: data.minutesTotal ?? 0,
      fallbackNumber: data.fallbackNumber,
      slaThresholdMin: data.slaThresholdMin ?? 15,
    },
    include: { plan: true },
  });

  return NextResponse.json({ business }, { status: 201 });
}
