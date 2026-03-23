"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CallStatus = "waiting" | "sla-breach" | "handled";
type SlaThreshold = 10 | 15 | 30;

interface MissedCall {
  id: string;
  phone: string;
  businessName: string;
  businessId: string;
  receivedAt: Date;
  status: CallStatus;
  assignedTo: string | null;
  notes: string;
  callbackAttempts: number;
  handledAt: Date | null;
}

interface BusinessSla {
  id: string;
  name: string;
  threshold: SlaThreshold;
  avgCallback: number; // minutes
  breachRate: number; // percent
}

// ─── API response types ──────────────────────────────────────────────────────

interface ApiMissedCall {
  id: string;
  phone: string;
  businessId: string;
  business: { id: string; name: string; slaThresholdMin: number };
  receivedAt: string;
  status: string;
  assignedToId: string | null;
  assignedTo: { name: string } | null;
  notes: string;
  callbackAttempts: number;
  handledAt: string | null;
}

function mapApiCall(raw: ApiMissedCall): MissedCall {
  return {
    id: raw.id,
    phone: raw.phone,
    businessName: raw.business.name,
    businessId: raw.businessId,
    receivedAt: new Date(raw.receivedAt),
    status: raw.status as CallStatus,
    assignedTo: raw.assignedTo?.name ?? null,
    notes: raw.notes ?? "",
    callbackAttempts: raw.callbackAttempts,
    handledAt: raw.handledAt ? new Date(raw.handledAt) : null,
  };
}

const AGENTS = ["דנה כהן", "יעל שמש", "מיכל גל"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function elapsedMs(since: Date, now: Date) {
  return Math.max(0, now.getTime() - since.getTime());
}

function formatElapsed(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function slaPercent(ms: number, thresholdMin: number) {
  return Math.min(100, Math.round((ms / (thresholdMin * 60 * 1000)) * 100));
}

function slaColor(pct: number) {
  if (pct >= 100) return { bar: "bg-red-500", text: "text-red-700", bg: "bg-red-50" };
  if (pct >= 70) return { bar: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" };
  return { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
}

function avgCallbackColor(avg: number, threshold: number) {
  if (avg >= threshold) return "text-red-600";
  if (avg >= threshold * 0.7) return "text-amber-600";
  return "text-emerald-600";
}

// ─── Row timer cell ───────────────────────────────────────────────────────────

function TimerCell({ since, thresholdMin, status }: { since: Date; thresholdMin: number; status: CallStatus }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (status === "handled") return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [status]);

  const ms = elapsedMs(since, now);
  const pct = slaPercent(ms, thresholdMin);
  const colors = slaColor(pct);

  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <div className="flex items-center justify-between gap-2">
        <span className={`font-mono text-sm font-bold tabular-nums ${status !== "handled" ? colors.text : "text-slate-400"}`}>
          {formatElapsed(ms)}
        </span>
        {status !== "handled" && pct >= 100 && (
          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 animate-pulse">
            SLA!
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-1.5 rounded-full transition-all duration-1000 ${status === "handled" ? "bg-slate-300" : colors.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-slate-400">SLA: {thresholdMin} דק׳</span>
    </div>
  );
}

// ─── Status selector ──────────────────────────────────────────────────────────

function StatusSelector({
  call,
  onUpdate,
}: {
  call: MissedCall;
  onUpdate: (id: string, patch: Partial<MissedCall>) => void;
}) {
  const OPTIONS: { value: CallStatus; label: string; color: string }[] = [
    { value: "waiting", label: "ממתין", color: "bg-sky-50 text-sky-700 ring-sky-200" },
    { value: "sla-breach", label: "חרג SLA", color: "bg-red-50 text-red-700 ring-red-200" },
    { value: "handled", label: "טופל", color: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  ];
  const current = OPTIONS.find((o) => o.value === call.status)!;

  return (
    <select
      value={call.status}
      onChange={(e) => onUpdate(call.id, { status: e.target.value as CallStatus })}
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 outline-none cursor-pointer ${current.color}`}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── SLA settings modal ───────────────────────────────────────────────────────

function SlaSettingsModal({
  slaData,
  onSave,
  onClose,
}: {
  slaData: BusinessSla[];
  onSave: (updated: BusinessSla[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(slaData.map((s) => ({ ...s })));

  function setThreshold(id: string, val: SlaThreshold) {
    setDraft((prev) => prev.map((s) => (s.id === id ? { ...s, threshold: val } : s)));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">הגדרות SLA לפי עסק</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        <div className="divide-y divide-slate-50 px-5">
          {draft.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-4">
              <p className="text-sm font-medium text-slate-700">{s.name}</p>
              <div className="flex gap-1.5">
                {([10, 15, 30] as SlaThreshold[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setThreshold(s.id, t)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      s.threshold === t
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {t} דק׳
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50">
            ביטול
          </button>
          <button
            onClick={() => { onSave(draft); onClose(); }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            שמור
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MissedCallsPage() {
  const [calls, setCalls] = useState<MissedCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CallStatus | "all">("all");
  const [slaData, setSlaData] = useState<BusinessSla[]>([]);
  const [showSlaSettings, setShowSlaSettings] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [flashBanner, setFlashBanner] = useState(true);
  const notesTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Fetch missed calls from API
  const fetchCalls = useCallback(async () => {
    try {
      const res = await fetch("/api/missed-calls");
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      const mapped = (data.missedCalls as ApiMissedCall[]).map(mapApiCall);
      setCalls(mapped);

      // Derive SLA data from business info
      const bizMap = new Map<string, { id: string; name: string; threshold: number }>();
      for (const raw of data.missedCalls as ApiMissedCall[]) {
        if (!bizMap.has(raw.businessId)) {
          bizMap.set(raw.businessId, {
            id: raw.businessId,
            name: raw.business.name,
            threshold: raw.business.slaThresholdMin,
          });
        }
      }

      // Compute avgCallback and breachRate per business from the calls
      const bizSla: BusinessSla[] = Array.from(bizMap.values()).map((biz) => {
        const bizCalls = mapped.filter((c) => c.businessId === biz.id);
        const handledCalls = bizCalls.filter((c) => c.status === "handled" && c.handledAt);
        const avgCb =
          handledCalls.length > 0
            ? Math.round(
                handledCalls.reduce(
                  (sum, c) => sum + elapsedMs(c.receivedAt, c.handledAt ?? c.receivedAt) / 60000,
                  0
                ) / handledCalls.length
              )
            : 0;
        const breachCount = bizCalls.filter((c) => c.status === "sla-breach").length;
        const breachRate = bizCalls.length > 0 ? Math.round((breachCount / bizCalls.length) * 100) : 0;

        return {
          id: biz.id,
          name: biz.name,
          threshold: biz.threshold as SlaThreshold,
          avgCallback: avgCb,
          breachRate,
        };
      });
      setSlaData(bizSla);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  // Global clock for metrics
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Banner flash
  useEffect(() => {
    const id = setInterval(() => setFlashBanner((v) => !v), 800);
    return () => clearInterval(id);
  }, []);

  // Patch a missed call on the server and update local state
  async function patchCall(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/missed-calls/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("PATCH failed", res.status);
      return;
    }
    const data = await res.json();
    // If server returns the updated call, use it; otherwise apply optimistic update
    if (data && data.id) {
      setCalls((prev) => prev.map((c) => (c.id === id ? mapApiCall(data) : c)));
    }
  }

  function updateCall(id: string, patch: Partial<MissedCall>) {
    // Optimistic local update
    setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

    // If status changed to handled, send PATCH
    if (patch.status === "handled") {
      patchCall(id, { status: "handled" });
    }

    // If notes changed, debounce the PATCH
    if (patch.notes !== undefined) {
      if (notesTimers.current[id]) clearTimeout(notesTimers.current[id]);
      notesTimers.current[id] = setTimeout(() => {
        patchCall(id, { notes: patch.notes });
      }, 500);
    }
  }

  function getThreshold(bizId: string): SlaThreshold {
    return slaData.find((s) => s.id === bizId)?.threshold ?? 15;
  }

  // Derived counts
  const waiting = calls.filter((c) => c.status === "waiting").length;
  const breached = calls.filter((c) => c.status === "sla-breach").length;
  const handled = calls.filter((c) => c.status === "handled").length;

  const handledWithTimes = calls.filter(
    (c) => c.status === "handled" && c.assignedTo
  );
  const avgCallback =
    handledWithTimes.length > 0
      ? Math.round(
          handledWithTimes.reduce(
            (s, c) => s + elapsedMs(c.receivedAt, c.handledAt ?? c.receivedAt) / 60000,
            0
          ) / handledWithTimes.length
        )
      : 0;

  const urgent = waiting + breached;

  const filtered =
    filter === "all" ? calls : calls.filter((c) => c.status === filter);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Urgent banner */}
      {urgent > 0 && (
        <div
          className={`flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white transition-colors duration-300 ${
            flashBanner ? "bg-red-600" : "bg-red-500"
          }`}
        >
          <span className="text-lg">🔴</span>
          <span>{urgent} שיחות לא נענו מחכות לטיפול — בדוק מיד!</span>
          <span className="text-lg">🔴</span>
        </div>
      )}

      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <span className="font-semibold text-slate-800">Servando</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            Missed Calls Board
          </span>
        </div>
        <button
          onClick={() => setShowSlaSettings(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          ⚙ הגדרות SLA
        </button>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
            <p className="text-sm text-slate-500">טוען שיחות...</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">שגיאה בטעינת נתונים</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchCalls(); }}
            className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            נסה שוב
          </button>
        </div>
      )}

      {!loading && !error && <main className="p-5 space-y-5">
        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "ממתינות לטיפול",
              value: waiting,
              icon: "⏳",
              color: "text-sky-600",
              bg: "bg-sky-50",
            },
            {
              label: "חרגו SLA",
              value: breached,
              icon: "🔴",
              color: "text-red-600",
              bg: "bg-red-50",
            },
            {
              label: "טופלו היום",
              value: handled,
              icon: "✅",
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "ממוצע callback",
              value: `${avgCallback} דק׳`,
              icon: "⏱",
              color: "text-slate-700",
              bg: "bg-slate-50",
            },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border border-slate-100 ${s.bg} p-4 shadow-sm`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className={`mt-1 text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                </div>
                <span className="text-xl">{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {(
              [
                { val: "all", label: "הכל" },
                { val: "waiting", label: "ממתין" },
                { val: "sla-breach", label: "חרג SLA" },
                { val: "handled", label: "טופל" },
              ] as const
            ).map((f) => (
              <button
                key={f.val}
                onClick={() => setFilter(f.val)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  filter === f.val
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f.label}
                {f.val !== "all" && (
                  <span className="ms-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px]">
                    {f.val === "waiting" ? waiting : f.val === "sla-breach" ? breached : handled}
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400">{filtered.length} שיחות</p>
        </div>

        {/* Main table */}
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {["מספר מתקשר", "עסק", "זמן המתנה / SLA", "סטטוס", "נציגה", "ניסיונות CB", "הערות", "פעולה"].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 whitespace-nowrap">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                      אין שיחות בסטטוס זה
                    </td>
                  </tr>
                ) : (
                  filtered.map((call) => {
                    const threshold = getThreshold(call.businessId);
                    const ms = elapsedMs(call.receivedAt, call.status === "handled" ? (call.handledAt ?? now) : now);
                    const pct = slaPercent(ms, threshold);
                    const colors = slaColor(pct);

                    return (
                      <tr
                        key={call.id}
                        className={`transition hover:bg-slate-50/60 ${
                          call.status === "sla-breach" ? "bg-red-50/30" : ""
                        }`}
                      >
                        {/* Phone */}
                        <td className="px-4 py-3 font-mono font-medium text-slate-700" dir="ltr">
                          {call.phone}
                        </td>

                        {/* Business */}
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          {call.businessName}
                        </td>

                        {/* Timer */}
                        <td className="px-4 py-3">
                          <TimerCell
                            since={call.receivedAt}
                            thresholdMin={threshold}
                            status={call.status}
                          />
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusSelector call={call} onUpdate={updateCall} />
                        </td>

                        {/* Agent */}
                        <td className="px-4 py-3">
                          <select
                            value={call.assignedTo ?? ""}
                            onChange={(e) =>
                              updateCall(call.id, { assignedTo: e.target.value || null })
                            }
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none focus:border-indigo-400"
                          >
                            <option value="">— שייך</option>
                            {AGENTS.map((a) => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </select>
                        </td>

                        {/* Attempts */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-600">{call.callbackAttempts}</span>
                            <button
                              onClick={() =>
                                updateCall(call.id, {
                                  callbackAttempts: call.callbackAttempts + 1,
                                })
                              }
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 hover:bg-slate-200"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Notes */}
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={call.notes}
                            onChange={(e) => updateCall(call.id, { notes: e.target.value })}
                            placeholder="הוסף הערה..."
                            className="w-32 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:bg-white"
                          />
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3">
                          {call.status !== "handled" && (
                            <button
                              onClick={() =>
                                updateCall(call.id, {
                                  status: "handled",
                                  callbackAttempts: call.callbackAttempts + 1,
                                })
                              }
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 whitespace-nowrap"
                            >
                              סמן טופל ✓
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SLA by business */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">SLA לפי עסק</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {slaData.map((s) => {
              const cbColor = avgCallbackColor(s.avgCallback, s.threshold);
              const brColor =
                s.breachRate >= 30 ? "text-red-600" : s.breachRate >= 15 ? "text-amber-600" : "text-emerald-600";

              return (
                <div key={s.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-slate-700">{s.name}</p>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      SLA: {s.threshold} דק׳
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-slate-50 p-2.5">
                      <p className="text-xs text-slate-400">ממוצע callback</p>
                      <p className={`mt-0.5 text-lg font-bold tabular-nums ${cbColor}`}>
                        {s.avgCallback} דק׳
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5">
                      <p className="text-xs text-slate-400">שיעור חריגה</p>
                      <p className={`mt-0.5 text-lg font-bold tabular-nums ${brColor}`}>
                        {s.breachRate}%
                      </p>
                    </div>
                  </div>
                  {/* SLA health bar */}
                  <div className="mt-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-2 rounded-full ${
                          s.breachRate >= 30
                            ? "bg-red-400"
                            : s.breachRate >= 15
                            ? "bg-amber-400"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${100 - Math.min(s.breachRate, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {100 - s.breachRate}% בתוך SLA
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>}

      {/* SLA settings modal */}
      {showSlaSettings && (
        <SlaSettingsModal
          slaData={slaData}
          onSave={setSlaData}
          onClose={() => setShowSlaSettings(false)}
        />
      )}
    </div>
  );
}
