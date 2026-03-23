export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/api-helpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await auth("ADMIN", "AGENT");
  if (error) return error;

  const { id } = await params;

  const tasks = await prisma.ticketTask.findMany({
    where: { ticketId: id },
    include: { assignee: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ tasks });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await auth("ADMIN", "AGENT");
  if (error) return error;

  const { id } = await params;
  const data = await req.json();

  const task = await prisma.ticketTask.create({
    data: {
      ticketId: id,
      text: data.text,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
    include: { assignee: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ task }, { status: 201 });
}
