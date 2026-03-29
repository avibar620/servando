export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await auth("ADMIN");
  if (error) return error;

  const [
    totalBusinesses,
    activeBusinesses,
    totalTickets,
    openTickets,
    totalCalls,
    missedWaiting,
    totalAgents,
    onlineAgents,
  ] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { status: "ACTIVE" } }),
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.call.count(),
    prisma.missedCall.count({ where: { status: "waiting" } }),
    prisma.user.count({ where: { role: "AGENT" } }),
    prisma.user.count({ where: { role: "AGENT", agentStatus: "ONLINE" } }),
  ]);

  // Businesses with low minutes (<=20)
  const lowMinutesBiz = await prisma.business.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, minutesTotal: true, minutesUsed: true },
  });
  const lowMinutes = lowMinutesBiz.filter(
    (b: { minutesTotal: number; minutesUsed: number }) => (b.minutesTotal - b.minutesUsed) <= 20
  );

  // Recent transactions revenue
  const recentTxn = await prisma.transaction.findMany({
    where: { status: "PAID" },
    select: { amountNis: true },
  });
  const totalRevenue = recentTxn.reduce((s: number, t: { amountNis: number }) => s + t.amountNis, 0);

  return NextResponse.json({
    totalBusinesses,
    activeBusinesses,
    totalTickets,
    openTickets,
    totalCalls,
    missedWaiting,
    totalAgents,
    onlineAgents,
    lowMinutesCount: lowMinutes.length,
    lowMinutesBusinesses: lowMinutes.map((b: { name: string; minutesTotal: number; minutesUsed: number }) => ({
      name: b.name,
      remaining: b.minutesTotal - b.minutesUsed,
    })),
    totalRevenue,
  });
}
