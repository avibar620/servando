export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/api-helpers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { error } = await auth("ADMIN", "AGENT");
  if (error) return error;

  const { taskId } = await params;
  const data = await req.json();

  const task = await prisma.ticketTask.update({
    where: { id: taskId },
    data,
  });

  return NextResponse.json({ task });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { error } = await auth("ADMIN", "AGENT");
  if (error) return error;

  const { taskId } = await params;

  await prisma.ticketTask.delete({ where: { id: taskId } });
  return NextResponse.json({ ok: true });
}
