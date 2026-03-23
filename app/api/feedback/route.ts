export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const { error } = await auth("ADMIN", "AGENT");
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status) where.status = status;
  if (category) where.category = category;

  const items = await prisma.feedback.findMany({
    where,
    include: {
      author: { select: { id: true, name: true } },
      upvoters: { select: { userId: true } },
    },
    orderBy: { upvotes: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const { session, error } = await auth("ADMIN", "AGENT");
  if (error) return error;

  const data = await req.json();

  const item = await prisma.feedback.create({
    data: {
      authorId: session!.userId,
      category: data.category ?? "OTHER",
      priority: data.priority ?? "MEDIUM",
      title: data.title,
      body: data.body,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ item }, { status: 201 });
}
