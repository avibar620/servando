import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, nextDisplayId } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const { session, error } = await auth("ADMIN", "AGENT", "CLIENT");
  if (error) return error;

  const url = new URL(req.url);
  const businessId = url.searchParams.get("businessId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (session!.role === "CLIENT") {
    where.businessId = session!.businessId;
  } else if (businessId) {
    where.businessId = businessId;
  }

  const calls = await prisma.call.findMany({
    where,
    include: {
      business: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true } },
    },
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ calls });
}

export async function POST(req: Request) {
  const { session, error } = await auth("ADMIN", "AGENT");
  if (error) return error;

  const data = await req.json();
  const displayId = await nextDisplayId("call");

  const call = await prisma.call.create({
    data: {
      displayId,
      businessId: data.businessId,
      agentId: session!.userId,
      ticketId: data.ticketId,
      callerPhone: data.callerPhone,
      routing: data.routing ?? "SERVANDO",
      startedAt: data.startedAt ? new Date(data.startedAt) : new Date(),
      endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
      durationSec: data.durationSec ?? 0,
      recordingUrl: data.recordingUrl,
      transcript: data.transcript,
    },
  });

  // Deduct minutes (round up to full minute)
  if (call.durationSec > 0) {
    const minutes = Math.ceil(call.durationSec / 60);
    await prisma.business.update({
      where: { id: data.businessId },
      data: { minutesUsed: { increment: minutes } },
    });
  }

  return NextResponse.json({ call }, { status: 201 });
}
