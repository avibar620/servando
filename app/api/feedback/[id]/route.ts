export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/api-helpers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await auth("ADMIN");
  if (error) return error;

  const { id } = await params;
  const data = await req.json();

  const updateData: Record<string, unknown> = {};
  if (data.status) updateData.status = data.status;
  if (data.adminReply !== undefined) {
    updateData.adminReply = data.adminReply;
    updateData.adminRepliedAt = new Date();
  }

  const item = await prisma.feedback.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ item });
}
