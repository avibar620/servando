export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await auth("ADMIN", "AGENT");
  if (error) return error;

  const missedCalls = await prisma.missedCall.findMany({
    include: {
      business: { select: { id: true, name: true, slaThresholdMin: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { receivedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ missedCalls });
}

export async function POST(req: Request) {
  const { error } = await auth("ADMIN", "AGENT");
  if (error) return error;

  const data = await req.json();

  const missedCall = await prisma.missedCall.create({
    data: {
      phone: data.phone,
      businessId: data.businessId,
      receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
    },
  });

  return NextResponse.json({ missedCall }, { status: 201 });
}
