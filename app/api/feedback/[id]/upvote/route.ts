import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/api-helpers";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await auth("ADMIN", "AGENT");
  if (error) return error;

  const { id } = await params;

  // Check if already upvoted
  const existing = await prisma.feedbackUpvote.findUnique({
    where: { feedbackId_userId: { feedbackId: id, userId: session!.userId } },
  });

  if (existing) {
    // Remove upvote
    await prisma.feedbackUpvote.delete({ where: { id: existing.id } });
    await prisma.feedback.update({
      where: { id },
      data: { upvotes: { decrement: 1 } },
    });
    return NextResponse.json({ upvoted: false });
  }

  // Add upvote
  await prisma.feedbackUpvote.create({
    data: { feedbackId: id, userId: session!.userId },
  });
  await prisma.feedback.update({
    where: { id },
    data: { upvotes: { increment: 1 } },
  });

  return NextResponse.json({ upvoted: true });
}
