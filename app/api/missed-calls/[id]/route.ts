export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, jsonError } from "@/lib/api-helpers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await auth("ADMIN", "AGENT");
  if (error) return error;

  const { id } = await params;
  const data = await req.json();

  const updateData: Record<string, unknown> = {};
  if (data.status) updateData.status = data.status;
  if (data.assignedToId) updateData.assignedToId = data.assignedToId;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.callbackAttempts !== undefined) updateData.callbackAttempts = data.callbackAttempts;
  if (data.status === "handled") updateData.handledAt = new Date();

  const missedCall = await prisma.missedCall.update({
    where: { id },
    data: updateData,
    include: {
      business: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  if (!missedCall) return jsonError("Not found", 404);
  return NextResponse.json({ missedCall });
}
