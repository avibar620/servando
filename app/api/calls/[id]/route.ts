export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, jsonError } from "@/lib/api-helpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await auth("ADMIN", "AGENT");
  if (error) return error;

  const { id } = await params;

  const call = await prisma.call.findUnique({
    where: { id },
    include: {
      business: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true } },
      ticket: { select: { id: true, displayId: true, subject: true } },
    },
  });

  if (!call) return jsonError("Not found", 404);
  return NextResponse.json({ call });
}
