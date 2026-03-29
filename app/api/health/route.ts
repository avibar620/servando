export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Quick DB connectivity check
    await prisma.plan.count();
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      db: "connected",
    });
  } catch {
    return NextResponse.json(
      { status: "error", timestamp: new Date().toISOString(), db: "disconnected" },
      { status: 503 }
    );
  }
}
