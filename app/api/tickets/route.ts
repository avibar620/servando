export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, nextDisplayId } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const { session, error } = await auth("ADMIN", "AGENT", "CLIENT");
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");
  const businessId = url.searchParams.get("businessId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  // Clients can only see their own business tickets
  if (session!.role === "CLIENT") {
    where.businessId = session!.businessId;
  } else if (businessId) {
    where.businessId = businessId;
  }

  if (status) where.status = status;
  if (type) where.type = type;

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      business: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const { session, error } = await auth("ADMIN", "AGENT");
  if (error) return error;

  const data = await req.json();
  const ticketType = data.type ?? "INTERNAL";
  const displayId = await nextDisplayId(
    ticketType === "REFERRED" ? "ticket_referred" : "ticket_internal"
  );

  const ticket = await prisma.ticket.create({
    data: {
      displayId,
      type: ticketType,
      caseType: data.caseType,
      subject: data.subject,
      priority: data.priority ?? "NORMAL",
      callerName: data.callerName,
      callerPhone: data.callerPhone,
      callerEmail: data.callerEmail,
      notes: data.notes,
      aiSummary: data.aiSummary,
      ownerMessage: data.ownerMessage,
      businessId: data.businessId,
      agentId: session!.userId,
    },
    include: {
      business: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true } },
    },
  });

  // Add creation history entry
  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket.id,
      actor: session!.userId,
      action: "create",
      detail: `כרטיס ${displayId} נוצר`,
    },
  });

  return NextResponse.json({ ticket }, { status: 201 });
}
