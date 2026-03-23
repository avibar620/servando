"use client";

import { useState, useEffect } from "react";

interface PortalBusiness {
  name: string;
  owner: string;
  phone: string;
  address: string;
  type: string;
  email: string;
  website: string;
  plan: string;
  minutesTotal: number;
  minutesUsed: number;
  minutesRemaining: number;
  fallbackNumber: string;
  servandoNumber: string;
}

interface PortalTicket {
  id: string;
  type: "referred" | "internal";
  subject: string;
  callerName: string;
  callerPhone: string;
  status: "open" | "in-progress" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  createdAt: string;
  agent: string;
  summary: string;
}

interface PortalCall {
  id: string;
  date: string;
  time: string;
  duration: string;
  callerPhone: string;
  agent: string;
  ticketId: string | null;
  routing: "servando" | "fallback" | "missed";
}

interface PortalTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "paid" | "pending" | "failed";
}

interface PortalData {
  business: PortalBusiness | null;
  myTickets: PortalTicket[];
  handledTickets: PortalTicket[];
  calls: PortalCall[];
  transactions: PortalTransaction[];
  loading: boolean;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTicket(t: any): PortalTicket {
  const statusMap: Record<string, "open" | "in-progress" | "closed"> = {
    OPEN: "open",
    IN_PROGRESS: "in-progress",
    CLOSED: "closed",
  };
  const prioMap: Record<string, "low" | "normal" | "high" | "urgent"> = {
    LOW: "low",
    NORMAL: "normal",
    HIGH: "high",
    URGENT: "urgent",
  };
  return {
    id: t.displayId,
    type: t.type === "REFERRED" ? "referred" : "internal",
    subject: t.subject,
    callerName: t.callerName ?? "",
    callerPhone: t.callerPhone ?? "",
    status: statusMap[t.status] ?? "open",
    priority: prioMap[t.priority] ?? "normal",
    createdAt: `${formatDate(t.createdAt)} ${formatTime(t.createdAt)}`,
    agent: t.agent?.name ?? "—",
    summary: t.aiSummary || t.notes || "",
  };
}

export function usePortalData(): PortalData {
  const [data, setData] = useState<PortalData>({
    business: null,
    myTickets: [],
    handledTickets: [],
    calls: [],
    transactions: [],
    loading: true,
  });

  useEffect(() => {
    async function load() {
      try {
        // Get current user to find businessId
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) return;
        const { user } = await meRes.json();
        if (!user?.businessId) return;

        // Fetch all data in parallel
        const [bizRes, ticketsRes, callsRes, txnRes] = await Promise.all([
          fetch(`/api/businesses/${user.businessId}`),
          fetch(`/api/tickets`),
          fetch(`/api/calls`),
          fetch(`/api/transactions`),
        ]);

        const bizData = bizRes.ok ? await bizRes.json() : null;
        const ticketsData = ticketsRes.ok ? await ticketsRes.json() : { tickets: [] };
        const callsData = callsRes.ok ? await callsRes.json() : { calls: [] };
        const txnData = txnRes.ok ? await txnRes.json() : { transactions: [] };

        const biz = bizData?.business;
        const business: PortalBusiness | null = biz
          ? {
              name: biz.name,
              owner: biz.ownerName,
              phone: biz.phone,
              address: biz.address || "",
              type: biz.category,
              email: biz.email,
              website: biz.website || "",
              plan: biz.plan?.name || "",
              minutesTotal: biz.minutesTotal,
              minutesUsed: biz.minutesUsed,
              minutesRemaining: biz.minutesTotal - biz.minutesUsed,
              fallbackNumber: biz.fallbackNumber || "",
              servandoNumber: biz.servandoNumber || "",
            }
          : null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allTickets = (ticketsData.tickets ?? []).map((t: any) => mapTicket(t));
        const myTickets = allTickets.filter((t: PortalTicket) => t.type === "referred");
        const handledTickets = allTickets.filter((t: PortalTicket) => t.type === "internal");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const calls: PortalCall[] = (callsData.calls ?? []).map((c: any) => ({
          id: c.displayId,
          date: formatDate(c.startedAt),
          time: formatTime(c.startedAt),
          duration: formatDuration(c.durationSec),
          callerPhone: c.callerPhone,
          agent: c.agent?.name ?? "—",
          ticketId: c.ticket?.displayId ?? null,
          routing: c.routing.toLowerCase() as "servando" | "fallback" | "missed",
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transactions: PortalTransaction[] = (txnData.transactions ?? []).map((t: any) => ({
          id: t.displayId,
          date: formatDate(t.createdAt),
          description: t.description,
          amount: t.amountNis,
          status: t.status.toLowerCase() as "paid" | "pending" | "failed",
        }));

        setData({ business, myTickets, handledTickets, calls, transactions, loading: false });
      } catch (err) {
        console.error("Portal data fetch error:", err);
        setData((prev) => ({ ...prev, loading: false }));
      }
    }

    load();
  }, []);

  return data;
}
