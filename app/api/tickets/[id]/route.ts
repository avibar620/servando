import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, jsonError } from "@/lib/api-helpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await auth("ADMIN", "AGENT", "CLIENT");
  if (error) return error;

  const { id } = await params;

  const ticket = await prisma.ticket.findFirst({
    where: { OR: [{ id }, { displayId: id }] },
    include: {
      business: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true } },
      tasks: { include: { assignee: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      aiOutputs: { orderBy: { generatedAt: "desc" } },
      history: { orderBy: { createdAt: "desc" }, take: 50 },
      calls: { orderBy: { startedAt: "desc" }, take: 10 },
    },
  });

  if (!ticket) return jsonError("Not found", 404);
  return NextResponse.json({ ticket });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await auth("ADMIN", "AGENT");
  if (error) return error;

  const { id } = await params;
  const data = await req.json();

  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      ...data,
      closedAt: data.status === "CLOSED" ? new Date() : undefined,
    },
  });

  // Log status change in history
  if (data.status) {
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        actor: session!.userId,
        action: "update",
        detail: `סטטוס שונה ל-${data.status}`,
      },
    });
  }

  return NextResponse.json({ ticket });
}
