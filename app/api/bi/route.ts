export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { auth } from "@/lib/api-helpers";

function getPrisma() {
  // Lazy import to avoid module-level Prisma initialization during build
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { prisma } = require("@/lib/prisma");
  return prisma;
}

export async function GET(req: Request) {
  const { error } = await auth("ADMIN");
  if (error) return error;

  const url = new URL(req.url);
  const tab = url.searchParams.get("tab") ?? "operations";

  switch (tab) {
    case "operations":
      return operations();
    case "agents":
      return agentsStats();
    case "clients":
      return clientsStats();
    case "revenue":
      return revenueStats();
    case "content":
      return contentStats();
    case "sla":
      return slaStats();
    default:
      return operations();
  }
}

async function operations() {
  const prisma = getPrisma();
  const [totalCalls, totalTickets, openTickets, missedCalls] = await Promise.all([
    prisma.call.count(),
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.missedCall.count({ where: { status: "waiting" } }),
  ]);

  const calls = await prisma.call.findMany({
    select: { startedAt: true, durationSec: true },
    orderBy: { startedAt: "desc" },
    take: 500,
  });

  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(12).fill(0) as number[]);
  for (const c of calls) {
    const d = new Date(c.startedAt);
    const day = d.getDay();
    const hourSlot = Math.floor(d.getHours() / 2);
    heatmap[day][hourSlot]++;
  }

  const avgDuration = calls.length
    ? Math.round(calls.reduce((s: number, c: { durationSec: number }) => s + c.durationSec, 0) / calls.length)
    : 0;

  return NextResponse.json({
    tab: "operations",
    totalCalls,
    totalTickets,
    openTickets,
    missedCalls,
    avgDurationSec: avgDuration,
    heatmap,
  });
}

async function agentsStats() {
  const prisma = getPrisma();
  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    select: {
      id: true,
      name: true,
      agentStatus: true,
      calls: { select: { durationSec: true } },
      assignedTickets: { select: { id: true } },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = agents.map((a: any) => ({
    name: a.name,
    status: (a.agentStatus ?? "OFFLINE").toLowerCase(),
    calls: a.calls.length,
    handled: a.assignedTickets.length,
    avgDur: a.calls.length
      ? Math.round(a.calls.reduce((s: number, c: { durationSec: number }) => s + c.durationSec, 0) / a.calls.length)
      : 0,
  }));

  return NextResponse.json({ tab: "agents", rows });
}

async function clientsStats() {
  const prisma = getPrisma();
  const businesses = await prisma.business.findMany({
    where: { status: { in: ["ACTIVE", "TRIAL"] } },
    select: {
      id: true,
      name: true,
      minutesTotal: true,
      minutesUsed: true,
      plan: { select: { name: true, slug: true } },
      tickets: { select: { id: true } },
      calls: { select: { id: true } },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = businesses.map((b: any) => ({
    name: b.name,
    calls: b.calls.length,
    tickets: b.tickets.length,
    minutesUsed: b.minutesUsed,
    minutesTotal: b.minutesTotal,
    plan: b.plan.name,
  }));

  return NextResponse.json({
    tab: "clients",
    totalActive: businesses.length,
    rows,
  });
}

async function revenueStats() {
  const prisma = getPrisma();
  const transactions = await prisma.transaction.findMany({
    where: { status: "PAID" },
    select: { amountNis: true, createdAt: true, description: true },
    orderBy: { createdAt: "desc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalRevenue = transactions.reduce((s: number, t: any) => s + t.amountNis, 0);

  const byMonth: Record<string, number> = {};
  for (const t of transactions) {
    const key = `${new Date(t.createdAt).getFullYear()}-${String(new Date(t.createdAt).getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] ?? 0) + t.amountNis;
  }

  const plans = await prisma.business.groupBy({
    by: ["planId"],
    _count: true,
    where: { status: { in: ["ACTIVE", "TRIAL"] } },
  });

  return NextResponse.json({
    tab: "revenue",
    totalRevenue,
    byMonth,
    planDistribution: plans,
  });
}

async function contentStats() {
  const prisma = getPrisma();
  const tickets = await prisma.ticket.findMany({
    select: { reasonCode: true, aiSummary: true, notes: true },
  });

  const reasonCounts: Record<string, number> = {};
  for (const t of tickets) {
    const reason = t.reasonCode || "כללי";
    reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
  }

  const reasonCodes = Object.entries(reasonCounts)
    .map(([label, count]: [string, number]) => ({ label, count, pct: Math.round((count / (tickets.length || 1)) * 100) }))
    .sort((a: { count: number }, b: { count: number }) => b.count - a.count);

  return NextResponse.json({
    tab: "content",
    totalAnalyzed: tickets.length,
    reasonCodes,
  });
}

async function slaStats() {
  const prisma = getPrisma();
  const missedCalls = await prisma.missedCall.findMany({
    include: {
      business: { select: { id: true, name: true, slaThresholdMin: true } },
    },
  });

  const total = missedCalls.length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const breaches = missedCalls.filter((m: any) => m.status === "sla-breach").length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handled = missedCalls.filter((m: any) => m.status === "handled").length;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bizMap: Record<string, any> = {};
  for (const m of missedCalls) {
    const key = m.businessId;
    if (!bizMap[key]) {
      bizMap[key] = {
        name: m.business.name,
        threshold: m.business.slaThresholdMin,
        total: 0,
        breaches: 0,
        handledTimes: [] as number[],
      };
    }
    bizMap[key].total++;
    if (m.status === "sla-breach") bizMap[key].breaches++;
    if (m.handledAt) {
      const waitMin = Math.round((new Date(m.handledAt).getTime() - new Date(m.receivedAt).getTime()) / 60000);
      bizMap[key].handledTimes.push(waitMin);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byBusiness = Object.values(bizMap).map((b: any) => ({
    business: b.name,
    threshold: b.threshold,
    breaches: b.breaches,
    compliance: b.total ? Math.round(((b.total - b.breaches) / b.total) * 100) : 100,
    avgCallback: b.handledTimes.length
      ? Math.round(b.handledTimes.reduce((s: number, v: number) => s + v, 0) / b.handledTimes.length)
      : 0,
  }));

  return NextResponse.json({
    tab: "sla",
    total,
    breaches,
    handled,
    compliancePct: total ? Math.round(((total - breaches) / total) * 100) : 100,
    byBusiness,
  });
}
