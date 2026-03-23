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

  const history = await prisma.ticketHistory.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ history });
}
