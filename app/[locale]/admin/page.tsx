"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminSection =
  | "dashboard"
  | "businesses"
  | "missed-calls"
  | "agents"
  | "plans"
  | "billing"
  | "onboarding"
  | "feedback"
  | "logs";

type MinuteStatus = "healthy" | "warning" | "critical" | "depleted";
type BusinessStatus = "active" | "paused" | "trial";

interface Business {
  id: string;
  name: string;
  owner: string;
  phone: string;
  email: string;
  type: string;
  plan: string;
  status: BusinessStatus;
  minutesTotal: number;
  minutesUsed: number;
  minutesRemaining: number;
  fallbackNumber: string;
  servandoNumber: string;
  joinedAt: string;
  mrr: number;
  openTickets: number;
  callsThisMonth: number;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  status: "online" | "busy" | "offline";
  callsToday: number;
  avgDuration: string;
  ticketsOpen: number;
}

interface LogEntry {
  id: string;
  ts: string;
  actor: string;
  action: string;
  target: string;
  level: "info" | "warning" | "error";
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const BUSINESSES: Business[] = [
  {
    id: "biz-01",
    name: "מספרת רוני",
    owner: "רוני לוי",
    phone: "052-555-1234",
    email: "roni@misperet-roni.co.il",
    type: "מספרה",
    plan: "עסקי",
    status: "active",
    minutesTotal: 120,
    minutesUsed: 78,
    minutesRemaining: 42,
    fallbackNumber: "03-555-9999",
    servandoNumber: "03-800-1001",
    joinedAt: "01/01/2026",
    mrr: 349,
    openTickets: 3,
    callsThisMonth: 9,
  },
  {
    id: "biz-02",
    name: "קוסמטיקה בת-אל",
    owner: "בת-אל כהן",
    phone: "054-321-6789",
    email: "batel@cosmetics.co.il",
    type: "קוסמטיקה",
    plan: "בסיסי",
    status: "active",
    minutesTotal: 60,
    minutesUsed: 55,
    minutesRemaining: 5,
    fallbackNumber: "04-555-1122",
    servandoNumber: "03-800-1002",
    joinedAt: "15/02/2026",
    mrr: 199,
    openTickets: 1,
    callsThisMonth: 14,
  },
  {
    id: "biz-03",
    name: "שיפוצים אלי",
    owner: "אלי פרץ",
    phone: "050-111-4444",
    email: "eli@shiputzim.co.il",
    type: "שיפוצים",
    plan: "פרימיום",
    status: "active",
    minutesTotal: 300,
    minutesUsed: 88,
    minutesRemaining: 212,
    fallbackNumber: "08-555-3344",
    servandoNumber: "03-800-1003",
    joinedAt: "10/12/2025",
    mrr: 649,
    openTickets: 5,
    callsThisMonth: 22,
  },
  {
    id: "biz-04",
    name: "רופא לביתך",
    owner: "ד״ר ישראל שפירא",
    phone: "053-999-8877",
    email: "dr.shapira@clinic.co.il",
    type: "רפואה",
    plan: "עסקי",
    status: "trial",
    minutesTotal: 120,
    minutesUsed: 12,
    minutesRemaining: 108,
    fallbackNumber: "02-555-6677",
    servandoNumber: "03-800-1004",
    joinedAt: "18/03/2026",
    mrr: 0,
    openTickets: 0,
    callsThisMonth: 4,
  },
  {
    id: "biz-05",
    name: "נגרות הדר",
    owner: "הדר יעקב",
    phone: "058-222-5555",
    email: "hadar@carpentry.co.il",
    type: "נגרות",
    plan: "בסיסי",
    status: "paused",
    minutesTotal: 60,
    minutesUsed: 0,
    minutesRemaining: 0,
    fallbackNumber: "09-555-1199",
    servandoNumber: "03-800-1005",
    joinedAt: "05/11/2025",
    mrr: 0,
    openTickets: 0,
    callsThisMonth: 0,
  },
];

const AGENTS: Agent[] = [
  { id: "ag-01", name: "דנה כהן", email: "dana@servando.co.il", status: "online", callsToday: 8, avgDuration: "2:42", ticketsOpen: 4 },
  { id: "ag-02", name: "יעל שמש", email: "yael@servando.co.il", status: "busy", callsToday: 6, avgDuration: "3:05", ticketsOpen: 3 },
  { id: "ag-03", name: "מיכל גל", email: "michal@servando.co.il", status: "online", callsToday: 5, avgDuration: "2:18", ticketsOpen: 2 },
  { id: "ag-04", name: "אורן לוי", email: "oren@servando.co.il", status: "offline", callsToday: 0, avgDuration: "—", ticketsOpen: 1 },
];

const LOG_ENTRIES: LogEntry[] = [
  { id: "l01", ts: "22/03/2026 15:41", actor: "System", action: "דקות אוזלות", target: "קוסמטיקה בת-אל (5 דקות)", level: "warning" },
  { id: "l02", ts: "22/03/2026 14:32", actor: "דנה כהן", action: "תיק נוצר", target: "#2256 — מספרת רוני", level: "info" },
  { id: "l03", ts: "22/03/2026 13:10", actor: "דנה כהן", action: "תיק פנימי נסגר", target: "K2549 — מספרת רוני", level: "info" },
  { id: "l04", ts: "22/03/2026 11:05", actor: "Admin", action: "30 דקות הוספו ידנית", target: "שיפוצים אלי", level: "info" },
  { id: "l05", ts: "21/03/2026 17:22", actor: "System", action: "Fallback הופעל", target: "נגרות הדר — דקות אזלו", level: "warning" },
  { id: "l06", ts: "21/03/2026 09:15", actor: "Admin", action: "עסק הושהה", target: "נגרות הדר", level: "warning" },
  { id: "l07", ts: "20/03/2026 16:00", actor: "System", action: "Onboarding נשלח", target: "רופא לביתך", level: "info" },
  { id: "l08", ts: "19/03/2026 10:30", actor: "יעל שמש", action: "תיק נפתח", target: "#2241 — מספרת רוני", level: "info" },
  { id: "l09", ts: "18/03/2026 14:00", actor: "System", action: "תשלום נכשל", target: "נגרות הדר — ₪199", level: "error" },
  { id: "l10", ts: "18/03/2026 08:00", actor: "Admin", action: "מסלול שונה", target: "שיפוצים אלי → פרימיום", level: "info" },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

function minuteStatus(remaining: number, total: number): MinuteStatus {
  if (remaining === 0) return "depleted";
  const pct = remaining / total;
  if (pct <= 0.17) return "critical";   // ≤20 min (≈17% of 120)
  if (pct <= 0.42) return "warning";    // 21-50
  return "healthy";
}

const MINUTE_STATUS_STYLES: Record<MinuteStatus, { bar: string; badge: string; text: string }> = {
  healthy: { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", text: "text-emerald-700" },
  warning: { bar: "bg-amber-400", badge: "bg-amber-50 text-amber-700 ring-amber-200", text: "text-amber-700" },
  critical: { bar: "bg-red-400", badge: "bg-red-50 text-red-700 ring-red-200", text: "text-red-700" },
  depleted: { bar: "bg-slate-300", badge: "bg-slate-100 text-slate-500 ring-slate-200", text: "text-slate-500" },
};

const BIZ_STATUS_STYLES: Record<BusinessStatus, { label: string; color: string }> = {
  active: { label: "פעיל", color: "bg-emerald-50 text-emerald-700" },
  paused: { label: "מושהה", color: "bg-amber-50 text-amber-700" },
  trial: { label: "ניסיון", color: "bg-sky-50 text-sky-700" },
};

const AGENT_STATUS: Record<string, { label: string; dot: string }> = {
  online: { label: "זמין", dot: "bg-emerald-500" },
  busy: { label: "עסוק", dot: "bg-amber-400" },
  offline: { label: "לא מחובר", dot: "bg-slate-300" },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-100 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
      {children}
    </h3>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color = "text-slate-800",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  color?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </Card>
  );
}

// ─── Business detail panel (5 tabs) ──────────────────────────────────────────

type BizTab = "overview" | "minutes" | "billing" | "knowledge" | "activity";

function BusinessDetail({ biz, onClose }: { biz: Business; onClose: () => void }) {
  const [tab, setTab] = useState<BizTab>("overview");
  const [addingMinutes, setAddingMinutes] = useState(false);
  const [minuteInput, setMinuteInput] = useState("30");
  const [minuteReason, setMinuteReason] = useState("");
  const [minuteSaved, setMinuteSaved] = useState(false);
  const [actionDone, setActionDone] = useState<string | null>(null);

  const ms = minuteStatus(biz.minutesRemaining, biz.minutesTotal);
  const styles = MINUTE_STATUS_STYLES[ms];
  const pct = Math.round((biz.minutesUsed / biz.minutesTotal) * 100);

  const BIZ_TABS: { id: BizTab; label: string }[] = [
    { id: "overview", label: "סקירה" },
    { id: "minutes", label: "דקות" },
    { id: "billing", label: "Billing" },
    { id: "knowledge", label: "Knowledge" },
    { id: "activity", label: "Activity Log" },
  ];

  function handleAddMinutes(e: React.FormEvent) {
    e.preventDefault();
    setAddingMinutes(false);
    setMinuteSaved(true);
    setTimeout(() => setMinuteSaved(false), 3000);
  }

  function triggerAction(label: string) {
    setActionDone(label);
    setTimeout(() => setActionDone(null), 3000);
  }

  return (
    <div className="flex flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-base font-bold text-indigo-600">
            {biz.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-800">{biz.name}</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BIZ_STATUS_STYLES[biz.status].color}`}>
                {BIZ_STATUS_STYLES[biz.status].label}
              </span>
            </div>
            <p className="text-xs text-slate-400">{biz.owner} · {biz.type} · מסלול {biz.plan}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
        {[
          { label: "הוסף דקות", icon: "⏱" },
          { label: "שנה מסלול", icon: "📦" },
          { label: "שלח Onboarding", icon: "📧" },
          { label: biz.status === "paused" ? "הפעל" : "השהה", icon: biz.status === "paused" ? "▶" : "⏸" },
        ].map((a) => (
          <button
            key={a.label}
            onClick={() => {
              if (a.label === "הוסף דקות") {
                setAddingMinutes(true);
              } else {
                triggerAction(a.label);
              }
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <span>{a.icon}</span> {a.label}
          </button>
        ))}
        {actionDone && (
          <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
            ✓ {actionDone} — בוצע
          </span>
        )}
      </div>

      {/* Add minutes modal */}
      {addingMinutes && (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-4">
          <form onSubmit={handleAddMinutes} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">כמות דקות</label>
              <input
                type="number"
                min="1"
                value={minuteInput}
                onChange={(e) => setMinuteInput(e.target.value)}
                className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">סיבה (לאודיט)</label>
              <input
                type="text"
                required
                value={minuteReason}
                onChange={(e) => setMinuteReason(e.target.value)}
                placeholder="פיצוי, בקשת לקוח..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <button type="submit" className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-600">
              הוסף
            </button>
            <button type="button" onClick={() => setAddingMinutes(false)} className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-500 hover:bg-slate-100">
              ביטול
            </button>
          </form>
        </div>
      )}
      {minuteSaved && (
        <div className="bg-emerald-50 px-5 py-2.5 text-xs font-medium text-emerald-700">
          ✓ {minuteInput} דקות הוספו ל{biz.name} — נרשם באודיט לוג
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-100 px-5">
        {BIZ_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.id
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "MRR", value: biz.mrr > 0 ? `₪${biz.mrr}` : "—" },
                { label: "שיחות החודש", value: biz.callsThisMonth },
                { label: "תיקים פתוחים", value: biz.openTickets },
                { label: "הצטרף", value: biz.joinedAt },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="text-xs text-slate-400">{s.label}</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: "טלפון", value: biz.phone, dir: "ltr" },
                { label: "אימייל", value: biz.email, dir: "ltr" },
                { label: "מספר Servando", value: biz.servandoNumber, dir: "ltr" },
                { label: "מספר Fallback", value: biz.fallbackNumber, dir: "ltr" },
              ].map((f) => (
                <div key={f.label} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">{f.label}</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-700" dir={f.dir}>{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Minutes */}
        {tab === "minutes" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className={`text-4xl font-bold tabular-nums ${styles.text}`}>{biz.minutesRemaining}</span>
                  <span className="ms-1 text-sm text-slate-400">/ {biz.minutesTotal} דקות</span>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${styles.badge}`}>
                  {Math.round((biz.minutesRemaining / biz.minutesTotal) * 100)}%
                </span>
              </div>
              <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div className={`h-3 rounded-full ${styles.bar}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-slate-400">
                <span>{biz.minutesUsed} נוצלו</span>
                <span>{biz.minutesRemaining} נותרו</span>
              </div>
            </div>
            {ms === "depleted" && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <strong>Fallback פעיל:</strong> שיחות מנותבות ל-{biz.fallbackNumber}
              </div>
            )}
            {ms === "critical" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                <strong>אזהרה:</strong> פחות מ-20 דקות נותרו. שקול להוסיף דקות.
              </div>
            )}
          </div>
        )}

        {/* Billing */}
        {tab === "billing" && (
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-400">מסלול נוכחי</p>
              <p className="mt-0.5 text-lg font-bold text-slate-800">מסלול {biz.plan}</p>
              <p className="text-sm text-slate-500">₪{biz.mrr} / חודש</p>
            </div>
            <div className="space-y-1 text-sm">
              {[
                { date: "01/03/2026", desc: `מסלול ${biz.plan} — מרץ`, amount: biz.mrr, ok: true },
                { date: "01/02/2026", desc: `מסלול ${biz.plan} — פברואר`, amount: biz.mrr, ok: true },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-700">{tx.desc}</p>
                    <p className="text-xs text-slate-400">{tx.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">₪{tx.amount}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${tx.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {tx.ok ? "שולם" : "נכשל"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Knowledge */}
        {tab === "knowledge" && (
          <div className="space-y-3 text-sm text-slate-600">
            <div className="rounded-lg bg-indigo-50 p-4 text-indigo-900">
              <p className="mb-1 text-xs font-semibold text-indigo-500">נוסח מענה</p>
              &ldquo;שלום, הגעתם ל{biz.name}. אני נציגת שירות הלקוחות. במה אוכל לסייע לכם?&rdquo;
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="mb-2 text-xs font-semibold text-slate-500">שאלות נפוצות</p>
              <p className="text-slate-400 text-xs">טרם הוגדרו שאלות נפוצות לעסק זה.</p>
            </div>
          </div>
        )}

        {/* Activity Log */}
        {tab === "activity" && (
          <div className="space-y-1">
            {LOG_ENTRIES.filter((_, i) => i < 5).map((entry) => (
              <div key={entry.id} className="flex gap-3 rounded-lg p-2.5 text-sm hover:bg-slate-50">
                <span className="mt-0.5 shrink-0 text-xs text-slate-400 tabular-nums">{entry.ts.split(" ")[1]}</span>
                <div>
                  <span className="font-medium text-slate-700">{entry.actor}</span>
                  <span className="text-slate-500"> · {entry.action}</span>
                  <span className="text-slate-400"> — {entry.target}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section: Dashboard ───────────────────────────────────────────────────────

function DashboardSection() {
  const totalMrr = BUSINESSES.filter((b) => b.status === "active").reduce((s, b) => s + b.mrr, 0);
  const active = BUSINESSES.filter((b) => b.status === "active").length;
  const totalCalls = BUSINESSES.reduce((s, b) => s + b.callsThisMonth, 0);
  const openTickets = BUSINESSES.reduce((s, b) => s + b.openTickets, 0);
  const critical = BUSINESSES.filter((b) => minuteStatus(b.minutesRemaining, b.minutesTotal) === "critical").length;
  const depleted = BUSINESSES.filter((b) => minuteStatus(b.minutesRemaining, b.minutesTotal) === "depleted").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="עסקים פעילים" value={active} sub={`מתוך ${BUSINESSES.length} סה״כ`} icon="🏢" color="text-indigo-600" />
        <StatCard label="שיחות היום" value={totalCalls} sub="החודש" icon="📞" color="text-sky-600" />
        <StatCard label="תיקים פתוחים" value={openTickets} icon="📂" color="text-amber-600" />
        <StatCard label="MRR" value={`₪${totalMrr.toLocaleString()}`} sub="הכנסה חודשית חוזרת" icon="💰" color="text-emerald-600" />
      </div>

      {/* Alerts */}
      {(critical > 0 || depleted > 0) && (
        <div className="space-y-2">
          {depleted > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span className="text-lg">🔴</span>
              <span><strong>{depleted} עסק</strong> אזלו להם הדקות — Fallback פעיל</span>
            </div>
          )}
          {critical > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <span className="text-lg">🟡</span>
              <span><strong>{critical} עסק</strong> עם פחות מ-20 דקות — שקול הוספה</span>
            </div>
          )}
        </div>
      )}

      {/* Agents on shift */}
      <Card className="p-5">
        <SectionTitle>נציגות — משמרת נוכחית</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {AGENTS.map((a) => (
            <div key={a.id} className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${AGENT_STATUS[a.status].dot}`} />
                <span className="font-medium text-slate-700 truncate">{a.name}</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                {a.callsToday} שיחות היום · ממוצע {a.avgDuration}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Minutes overview table */}
      <Card>
        <div className="border-b border-slate-100 px-5 py-3">
          <p className="text-sm font-semibold text-slate-700">מצב דקות — כל העסקים</p>
        </div>
        <div className="divide-y divide-slate-50">
          {BUSINESSES.map((b) => {
            const ms = minuteStatus(b.minutesRemaining, b.minutesTotal);
            const s = MINUTE_STATUS_STYLES[ms];
            const pct = b.minutesTotal > 0 ? Math.round((b.minutesUsed / b.minutesTotal) * 100) : 100;
            return (
              <div key={b.id} className="flex items-center gap-4 px-5 py-3">
                <p className="w-36 shrink-0 text-sm font-medium text-slate-700 truncate">{b.name}</p>
                <div className="flex-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full ${s.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className={`w-28 shrink-0 text-end text-xs font-semibold ${s.text}`}>
                  {b.minutesRemaining === 0 ? "אזלו — Fallback" : `${b.minutesRemaining} / ${b.minutesTotal}`}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── Section: Businesses ──────────────────────────────────────────────────────

function BusinessesSection() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BusinessStatus | "all">("all");

  const selectedBiz = BUSINESSES.find((b) => b.id === selectedId) ?? null;

  const filtered = BUSINESSES.filter((b) => {
    const matchSearch =
      b.name.includes(search) || b.owner.includes(search) || b.type.includes(search);
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex h-full gap-4">
      {/* List */}
      <div className={`flex flex-col gap-3 ${selectedBiz ? "w-80 shrink-0" : "flex-1"}`}>
        {/* Filters */}
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="חיפוש עסק..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {(["all", "active", "trial", "paused"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  statusFilter === s ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"
                }`}
              >
                {s === "all" ? "הכל" : BIZ_STATUS_STYLES[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Business cards */}
        <div className="space-y-2 overflow-y-auto">
          {filtered.map((b) => {
            const ms = minuteStatus(b.minutesRemaining, b.minutesTotal);
            const s = MINUTE_STATUS_STYLES[ms];
            const pct = b.minutesTotal > 0 ? Math.round((b.minutesUsed / b.minutesTotal) * 100) : 100;
            return (
              <button
                key={b.id}
                onClick={() => setSelectedId(selectedId === b.id ? null : b.id)}
                className={`w-full rounded-xl border p-4 text-start transition ${
                  selectedId === b.id
                    ? "border-indigo-300 bg-indigo-50/60"
                    : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{b.name}</p>
                    <p className="text-xs text-slate-400">{b.owner} · {b.type}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${BIZ_STATUS_STYLES[b.status].color}`}>
                    {BIZ_STATUS_STYLES[b.status].label}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>דקות</span>
                    <span className={s.text}>{b.minutesRemaining} נותרו</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-1.5 rounded-full ${s.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selectedBiz && (
        <Card className="flex flex-1 flex-col overflow-hidden">
          <BusinessDetail biz={selectedBiz} onClose={() => setSelectedId(null)} />
        </Card>
      )}
    </div>
  );
}

// ─── Section: Agents ─────────────────────────────────────────────────────────

function AgentsSection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "נציגות פעילות", value: AGENTS.filter((a) => a.status !== "offline").length, icon: "👤" },
          { label: "שיחות היום (סה״כ)", value: AGENTS.reduce((s, a) => s + a.callsToday, 0), icon: "📞" },
          { label: "תיקים פתוחים (סה״כ)", value: AGENTS.reduce((s, a) => s + a.ticketsOpen, 0), icon: "📂" },
          { label: "נציגות במשמרת", value: AGENTS.filter((a) => a.status === "online" || a.status === "busy").length, icon: "🟢" },
        ].map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {["נציגה", "סטטוס", "שיחות היום", "משך ממוצע", "תיקים פתוחים", "אימייל"].map((h) => (
                  <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {AGENTS.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-800">{a.name}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${AGENT_STATUS[a.status].dot}`} />
                      <span className="text-slate-600">{AGENT_STATUS[a.status].label}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.callsToday}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{a.avgDuration}</td>
                  <td className="px-4 py-3 text-slate-600">{a.ticketsOpen}</td>
                  <td className="px-4 py-3 text-slate-400" dir="ltr">{a.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Section: Plans ───────────────────────────────────────────────────────────

function PlansSection() {
  const PLANS = [
    { name: "בסיסי", minutes: 60, price: 199, businesses: BUSINESSES.filter((b) => b.plan === "בסיסי").length },
    { name: "עסקי", minutes: 120, price: 349, businesses: BUSINESSES.filter((b) => b.plan === "עסקי").length },
    { name: "פרימיום", minutes: 300, price: 649, businesses: BUSINESSES.filter((b) => b.plan === "פרימיום").length },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.name} className="p-5">
            <p className="text-sm font-semibold text-slate-700">מסלול {p.name}</p>
            <p className="mt-3 text-3xl font-bold text-indigo-600">₪{p.price}</p>
            <p className="text-xs text-slate-400">לחודש</p>
            <div className="mt-3 space-y-1.5 text-sm text-slate-600">
              <p>⏱ {p.minutes} דקות / חודש</p>
              <p>🏢 {p.businesses} עסקים פעילים</p>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <p className="text-sm text-slate-500">ניהול מסלולים מפורט יהיה זמין בשלב הבא.</p>
      </Card>
    </div>
  );
}

// ─── Section: Logs ────────────────────────────────────────────────────────────

function LogsSection() {
  const LEVEL_STYLES: Record<string, string> = {
    info: "bg-sky-50 text-sky-700",
    warning: "bg-amber-50 text-amber-700",
    error: "bg-red-50 text-red-700",
  };
  const LEVEL_DOT: Record<string, string> = {
    info: "bg-sky-400",
    warning: "bg-amber-400",
    error: "bg-red-500",
  };

  return (
    <Card>
      <div className="border-b border-slate-100 px-5 py-3">
        <p className="text-sm font-semibold text-slate-700">System Log</p>
      </div>
      <div className="divide-y divide-slate-50">
        {LOG_ENTRIES.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50/60">
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${LEVEL_DOT[entry.level]}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-slate-700">{entry.action}</span>
                <span className="text-xs text-slate-400">{entry.target}</span>
              </div>
              <p className="text-xs text-slate-400">{entry.ts} · {entry.actor}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_STYLES[entry.level]}`}>
              {entry.level}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Placeholder sections ────────────────────────────────────────────────────

function PlaceholderSection({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-20 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="mt-3 text-base font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-sm text-slate-400">מסך זה ייבנה בשלב הבא</p>
    </div>
  );
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: AdminSection; label: string; icon: string }[] = [
  { id: "dashboard", label: "דשבורד", icon: "🏠" },
  { id: "businesses", label: "עסקים", icon: "🏢" },
  { id: "missed-calls", label: "Missed Calls", icon: "📵" },
  { id: "agents", label: "נציגות", icon: "👤" },
  { id: "plans", label: "מסלולים", icon: "📦" },
  { id: "billing", label: "חיובים", icon: "💳" },
  { id: "onboarding", label: "Onboarding", icon: "🚀" },
  { id: "feedback", label: "Feedback", icon: "💬" },
  { id: "logs", label: "Logs", icon: "📋" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminConsolePage() {
  const [section, setSection] = useState<AdminSection>("dashboard");

  const activeLabel = NAV_ITEMS.find((n) => n.id === section)?.label ?? "";
  const activeIcon = NAV_ITEMS.find((n) => n.id === section)?.icon ?? "";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-e border-slate-200 bg-white lg:flex">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-slate-100 px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Servando</p>
            <p className="text-[10px] text-slate-400">Admin Console</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                section === item.id
                  ? "bg-indigo-50 font-semibold text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Admin badge */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              A
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-700">Admin</p>
              <p className="truncate text-[10px] text-slate-400">admin@servando.co.il</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden text-slate-400 lg:block">Admin Console /</span>
            <span className="font-semibold text-slate-700">{activeIcon} {activeLabel}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="hidden items-center gap-1 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {AGENTS.filter((a) => a.status !== "offline").length} נציגות פעילות
            </span>
            <span className="hidden sm:block">|</span>
            <span>{BUSINESSES.filter((b) => b.status === "active").length} עסקים פעילים</span>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="flex overflow-x-auto border-b border-slate-200 bg-white px-2 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex shrink-0 items-center gap-1 px-3 py-2.5 text-xs font-medium transition ${
                section === item.id
                  ? "border-b-2 border-indigo-600 text-indigo-700"
                  : "text-slate-500"
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">
          {section === "dashboard" && <DashboardSection />}
          {section === "businesses" && <BusinessesSection />}
          {section === "agents" && <AgentsSection />}
          {section === "plans" && <PlansSection />}
          {section === "logs" && <LogsSection />}
          {section === "missed-calls" && <PlaceholderSection label="Missed Calls Board" icon="📵" />}
          {section === "billing" && <PlaceholderSection label="חיובים" icon="💳" />}
          {section === "onboarding" && <PlaceholderSection label="Onboarding" icon="🚀" />}
          {section === "feedback" && <PlaceholderSection label="Feedback Board" icon="💬" />}
        </main>
      </div>
    </div>
  );
}
