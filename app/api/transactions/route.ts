export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const { session, error } = await auth("ADMIN", "CLIENT");
  if (error) return error;

  const url = new URL(req.url);
  const businessId = url.searchParams.get("businessId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (session!.role === "CLIENT") {
    where.businessId = session!.businessId;
  } else if (businessId) {
    where.businessId = businessId;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ transactions });
}
