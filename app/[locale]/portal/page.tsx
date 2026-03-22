"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId =
  | "dashboard"
  | "my-tickets"
  | "handled"
  | "calls"
  | "billing"
  | "business-info"
  | "cancel";

type TicketStatus = "open" | "in-progress" | "closed";
type Priority = "low" | "normal" | "high" | "urgent";

interface Ticket {
  id: string; // "#2256" or "K2549"
  type: "referred" | "internal";
  subject: string;
  callerName: string;
  callerPhone: string;
  status: TicketStatus;
  priority: Priority;
  createdAt: string;
  agent: string;
  summary: string;
}

interface Call {
  id: string;
  date: string;
  time: string;
  duration: string;
  callerPhone: string;
  agent: string;
  ticketId: string | null;
  routing: "servando" | "fallback" | "missed";
}

interface MinutePackage {
  id: string;
  name: string;
  minutes: number;
  price: number;
  popular?: boolean;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "paid" | "pending" | "failed";
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const BUSINESS = {
  name: "מספרת רוני",
  owner: "רוני לוי",
  phone: "052-555-1234",
  address: "רחוב הרצל 12, תל אביב",
  type: "מספרה ועיצוב שיער",
  email: "roni@misperet-roni.co.il",
  website: "www.misperet-roni.co.il",
  plan: "עסקי",
  minutesTotal: 120,
  minutesUsed: 78,
  minutesRemaining: 42,
  fallbackNumber: "03-555-9999",
  servandoNumber: "03-800-1234",
};

const MY_TICKETS: Ticket[] = [
  {
    id: "#2256",
    type: "referred",
    subject: "לקוח מעוניין בצביעת שיער",
    callerName: "שרה כהן",
    callerPhone: "050-111-2222",
    status: "open",
    priority: "high",
    createdAt: "22/03/2026 14:32",
    agent: "דנה כהן",
    summary: "לקוחה שאלה על מחירי צביעה מלאה וגוונים. מעוניינת לקבוע תור לשבוע הבא.",
  },
  {
    id: "#2249",
    type: "referred",
    subject: "שאלה על מחיר תספורת נשים",
    callerName: "מירי לוי",
    callerPhone: "054-333-4444",
    status: "in-progress",
    priority: "normal",
    createdAt: "21/03/2026 11:15",
    agent: "יעל שמש",
    summary: "לקוחה שאלה על מחירים ושעות פעילות ליום שישי.",
  },
  {
    id: "#2241",
    type: "referred",
    subject: "תלונה על שירות",
    callerName: "דוד ברק",
    callerPhone: "052-777-8888",
    status: "open",
    priority: "urgent",
    createdAt: "20/03/2026 09:47",
    agent: "דנה כהן",
    summary: "לקוח ביטא אי-שביעות רצון מתספורת אחרונה. מבקש שיחה חוזרת מהבעלים.",
  },
  {
    id: "#2230",
    type: "referred",
    subject: "בקשה לתיאום תור",
    callerName: "לימור ישראלי",
    callerPhone: "058-222-3333",
    status: "closed",
    priority: "normal",
    createdAt: "18/03/2026 16:20",
    agent: "יעל שמש",
    summary: "לקוחה ביקשה לתאם תור לצביעה ביום שלישי. הועבר פנייה לביצוע.",
  },
];

const HANDLED_TICKETS: Ticket[] = [
  {
    id: "K2549",
    type: "internal",
    subject: "שאלה כללית על שעות פעילות",
    callerName: "אבי גולן",
    callerPhone: "050-555-6666",
    status: "closed",
    priority: "low",
    createdAt: "22/03/2026 13:10",
    agent: "דנה כהן",
    summary: "לקוח שאל על שעות הפעילות של המספרה בחג. ענינו לו בהתאם למידע העסק.",
  },
  {
    id: "K2541",
    type: "internal",
    subject: "שאלה על מחיר פן",
    callerName: "נעמה דוד",
    callerPhone: "052-444-5555",
    status: "closed",
    priority: "low",
    createdAt: "21/03/2026 10:05",
    agent: "יעל שמש",
    summary: "לקוחה שאלה על מחיר פן וזמינות ליום שני. נמסר מידע ועודדה לקבוע תור.",
  },
  {
    id: "K2535",
    type: "internal",
    subject: "שאלה על חניה",
    callerName: "יוסי כץ",
    callerPhone: "054-666-7777",
    status: "closed",
    priority: "low",
    createdAt: "20/03/2026 15:30",
    agent: "דנה כהן",
    summary: "לקוח שאל על אפשרויות חניה בסביבת המספרה. נמסר מידע על חניה חופשית.",
  },
  {
    id: "K2522",
    type: "internal",
    subject: "מידע על מדיניות ביטול תור",
    callerName: "רינה הלוי",
    callerPhone: "058-888-9999",
    status: "closed",
    priority: "normal",
    createdAt: "19/03/2026 12:45",
    agent: "יעל שמש",
    summary: "לקוחה שאלה על מדיניות ביטול תור. הסברנו שניתן לבטל עד 24 שעות מראש.",
  },
  {
    id: "K2510",
    type: "internal",
    subject: "שאלה על שירות גוונים",
    callerName: "מרים אלון",
    callerPhone: "050-111-0000",
    status: "closed",
    priority: "normal",
    createdAt: "18/03/2026 08:55",
    agent: "דנה כהן",
    summary: "לקוחה שאלה על ההבדל בין גוונים לצביעה מלאה ומחירים. נמסר הסבר מפורט.",
  },
];

const CALLS: Call[] = [
  {
    id: "C-0891",
    date: "22/03/2026",
    time: "14:32",
    duration: "3:41",
    callerPhone: "050-111-2222",
    agent: "דנה כהן",
    ticketId: "#2256",
    routing: "servando",
  },
  {
    id: "C-0890",
    date: "22/03/2026",
    time: "13:10",
    duration: "1:55",
    callerPhone: "050-555-6666",
    agent: "דנה כהן",
    ticketId: "K2549",
    routing: "servando",
  },
  {
    id: "C-0889",
    date: "21/03/2026",
    time: "11:15",
    duration: "2:20",
    callerPhone: "054-333-4444",
    agent: "יעל שמש",
    ticketId: "#2249",
    routing: "servando",
  },
  {
    id: "C-0888",
    date: "21/03/2026",
    time: "10:05",
    duration: "1:30",
    callerPhone: "052-444-5555",
    agent: "יעל שמש",
    ticketId: "K2541",
    routing: "servando",
  },
  {
    id: "C-0887",
    date: "20/03/2026",
    time: "17:45",
    duration: "0:00",
    callerPhone: "053-000-1111",
    agent: "—",
    ticketId: null,
    routing: "missed",
  },
  {
    id: "C-0886",
    date: "20/03/2026",
    time: "15:30",
    duration: "1:10",
    callerPhone: "054-666-7777",
    agent: "דנה כהן",
    ticketId: "K2535",
    routing: "servando",
  },
  {
    id: "C-0885",
    date: "20/03/2026",
    time: "09:47",
    duration: "4:12",
    callerPhone: "052-777-8888",
    agent: "דנה כהן",
    ticketId: "#2241",
    routing: "servando",
  },
  {
    id: "C-0884",
    date: "19/03/2026",
    time: "12:45",
    duration: "2:05",
    callerPhone: "058-888-9999",
    agent: "יעל שמש",
    ticketId: "K2522",
    routing: "servando",
  },
  {
    id: "C-0883",
    date: "19/03/2026",
    time: "10:20",
    duration: "0:00",
    callerPhone: "050-222-3333",
    agent: "—",
    ticketId: null,
    routing: "fallback",
  },
];

const MINUTE_PACKAGES: MinutePackage[] = [
  { id: "pkg-50", name: "חבילה קטנה", minutes: 50, price: 149 },
  { id: "pkg-100", name: "חבילה רגילה", minutes: 100, price: 279, popular: true },
  { id: "pkg-200", name: "חבילה גדולה", minutes: 200, price: 499 },
  { id: "pkg-500", name: "חבילה עסקית", minutes: 500, price: 1099 },
];

const TRANSACTIONS: Transaction[] = [
  { id: "TXN-3041", date: "01/03/2026", description: "מסלול עסקי — מרץ 2026", amount: 349, status: "paid" },
  { id: "TXN-3012", date: "15/02/2026", description: "חבילת 100 דקות נוספות", amount: 279, status: "paid" },
  { id: "TXN-2989", date: "01/02/2026", description: "מסלול עסקי — פברואר 2026", amount: 349, status: "paid" },
  { id: "TXN-2951", date: "01/01/2026", description: "מסלול עסקי — ינואר 2026", amount: 349, status: "paid" },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

const PRIORITY_LABEL: Record<Priority, { label: string; color: string }> = {
  low: { label: "נמוכה", color: "bg-slate-100 text-slate-600" },
  normal: { label: "רגילה", color: "bg-blue-50 text-blue-700" },
  high: { label: "גבוהה", color: "bg-amber-50 text-amber-700" },
  urgent: { label: "דחוף", color: "bg-red-50 text-red-700" },
};

const STATUS_LABEL: Record<TicketStatus, { label: string; color: string; dot: string }> = {
  open: { label: "פתוח", color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  "in-progress": { label: "בטיפול", color: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-500" },
  closed: { label: "סגור", color: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

function minutesColor(remaining: number) {
  if (remaining > 50) return { bar: "bg-emerald-500", text: "text-emerald-700", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  if (remaining > 20) return { bar: "bg-amber-400", text: "text-amber-700", badge: "bg-amber-50 text-amber-700 ring-amber-200" };
  if (remaining > 0) return { bar: "bg-red-400", text: "text-red-700", badge: "bg-red-50 text-red-700 ring-red-200" };
  return { bar: "bg-slate-300", text: "text-slate-500", badge: "bg-slate-100 text-slate-500 ring-slate-200" };
}

function TicketBadge({ id }: { id: string }) {
  const isInternal = id.startsWith("K");
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isInternal
          ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200"
          : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
      }`}
    >
      {id}
    </span>
  );
}

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

// ─── Tab: Dashboard ───────────────────────────────────────────────────────────

function DashboardTab() {
  const colors = minutesColor(BUSINESS.minutesRemaining);
  const pct = Math.round((BUSINESS.minutesUsed / BUSINESS.minutesTotal) * 100);

  const callTypeData = [
    { label: "שאלות כלליות", minutes: 28, color: "bg-sky-400" },
    { label: "תיאום תורים", minutes: 22, color: "bg-indigo-500" },
    { label: "לידים חדשים", minutes: 18, color: "bg-violet-500" },
    { label: "הודעות לבעלים", minutes: 10, color: "bg-amber-400" },
  ];
  const totalCallMinutes = callTypeData.reduce((s, d) => s + d.minutes, 0);

  const openTickets = MY_TICKETS.filter((t) => t.status === "open").length;
  const handledThisMonth = HANDLED_TICKETS.length;
  const missedCalls = CALLS.filter((c) => c.routing === "missed").length;

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "תיקים פתוחים", value: openTickets, icon: "📂", color: "text-indigo-600" },
          { label: "טופל ע\"י Servando", value: handledThisMonth, icon: "✅", color: "text-emerald-600" },
          { label: "שיחות החודש", value: CALLS.length, icon: "📞", color: "text-sky-600" },
          { label: "שיחות שלא נענו", value: missedCalls, icon: "⚠️", color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
              <span className="text-xl">{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Minutes balance */}
        <Card className="p-5">
          <SectionTitle>מאזן דקות — מרץ 2026</SectionTitle>
          <div className="flex items-end justify-between">
            <div>
              <span className={`text-4xl font-bold tabular-nums ${colors.text}`}>
                {BUSINESS.minutesRemaining}
              </span>
              <span className="ms-1 text-sm text-slate-400">/ {BUSINESS.minutesTotal} דקות</span>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${colors.badge}`}>
              {Math.round((BUSINESS.minutesRemaining / BUSINESS.minutesTotal) * 100)}% נותרו
            </span>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-3 rounded-full transition-all ${colors.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>{BUSINESS.minutesUsed} דקות נוצלו</span>
            <span>{BUSINESS.minutesRemaining} דקות נותרו</span>
          </div>
          {BUSINESS.minutesRemaining <= 20 && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
              <strong>שים לב:</strong> הדקות עומדות להסתיים. בזריזות ↓{" "}
              {BUSINESS.minutesRemaining === 0
                ? `שיחות מופנות אוטומטית למספר ${BUSINESS.fallbackNumber}`
                : "רכוש חבילת דקות נוספת"}
            </div>
          )}
        </Card>

        {/* Call-type minutes bar chart */}
        <Card className="p-5">
          <SectionTitle>ניצול דקות לפי סוג שיחה</SectionTitle>
          <div className="space-y-3">
            {callTypeData.map((d) => (
              <div key={d.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-600">{d.label}</span>
                  <span className="font-medium text-slate-700">{d.minutes} דק׳</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-2.5 rounded-full ${d.color}`}
                    style={{ width: `${Math.round((d.minutes / totalCallMinutes) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            סה״כ {totalCallMinutes} דקות מנוצלות החודש
          </p>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="p-5">
        <SectionTitle>פעילות אחרונה</SectionTitle>
        <div className="divide-y divide-slate-50">
          {[...MY_TICKETS.slice(0, 2), ...HANDLED_TICKETS.slice(0, 2)]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 4)
            .map((t) => (
              <div key={t.id} className="flex items-start gap-3 py-3">
                <TicketBadge id={t.id} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">{t.subject}</p>
                  <p className="text-xs text-slate-400">{t.createdAt} · {t.agent}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_LABEL[t.status].color}`}
                >
                  {STATUS_LABEL[t.status].label}
                </span>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Shared: Ticket list ──────────────────────────────────────────────────────

function TicketList({
  tickets,
  emptyText,
}: {
  tickets: Ticket[];
  emptyText: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedTicket = tickets.find((t) => t.id === selected);

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl">📭</span>
        <p className="mt-3 text-sm text-slate-400">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* List */}
      <div className="space-y-2 lg:col-span-1">
        {tickets.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(selected === t.id ? null : t.id)}
            className={`w-full rounded-xl border p-4 text-start transition ${
              selected === t.id
                ? "border-indigo-300 bg-indigo-50/60 shadow-sm"
                : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <TicketBadge id={t.id} />
              <span
                className={`ms-auto flex h-2 w-2 rounded-full ${STATUS_LABEL[t.status].dot}`}
              />
            </div>
            <p className="mt-2 truncate text-sm font-medium text-slate-700">{t.subject}</p>
            <p className="mt-1 text-xs text-slate-400">{t.createdAt}</p>
          </button>
        ))}
      </div>

      {/* Detail panel */}
      <div className="lg:col-span-2">
        {selectedTicket ? (
          <Card className="p-5">
            <div className="mb-4 flex items-start gap-3">
              <TicketBadge id={selectedTicket.id} />
              <div className="flex-1">
                <h2 className="text-base font-semibold text-slate-800">{selectedTicket.subject}</h2>
                <p className="text-xs text-slate-400">{selectedTicket.createdAt}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_LABEL[selectedTicket.status].color}`}
              >
                {STATUS_LABEL[selectedTicket.status].label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "מתקשר", value: selectedTicket.callerName },
                { label: "טלפון", value: selectedTicket.callerPhone },
                { label: "נציגה", value: selectedTicket.agent },
                {
                  label: "עדיפות",
                  value: (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_LABEL[selectedTicket.priority].color}`}>
                      {PRIORITY_LABEL[selectedTicket.priority].label}
                    </span>
                  ),
                },
              ].map((f) => (
                <div key={f.label} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">{f.label}</p>
                  <p className="mt-0.5 font-medium text-slate-700">{f.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium text-slate-500">סיכום שיחה</p>
              <div className="rounded-lg bg-indigo-50 p-3 text-sm leading-relaxed text-indigo-900">
                {selectedTicket.summary}
              </div>
            </div>

            {selectedTicket.type === "internal" && (
              <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-700">
                תיק זה טופל במלואו על ידי נציגות Servando — אין צורך בפעולה מצדך.
              </div>
            )}
          </Card>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <div>
              <span className="text-3xl">👈</span>
              <p className="mt-2 text-sm text-slate-400">בחר תיק לצפייה בפרטים</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: My Tickets ──────────────────────────────────────────────────────────

function MyTicketsTab() {
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");

  const filtered =
    statusFilter === "all"
      ? MY_TICKETS
      : MY_TICKETS.filter((t) => t.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">תיקים שלי</h2>
          <p className="text-xs text-slate-400">
            תיקים שהועברו לטיפולך — ממוספרים{" "}
            <span className="font-semibold text-indigo-600">#XXXX</span>
          </p>
        </div>
        <div className="flex gap-1.5 rounded-lg bg-slate-100 p-1">
          {(["all", "open", "in-progress", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                statusFilter === s
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {s === "all" ? "הכל" : STATUS_LABEL[s].label}
            </button>
          ))}
        </div>
      </div>
      <TicketList tickets={filtered} emptyText="אין תיקים בסטטוס זה" />
    </div>
  );
}

// ─── Tab: Handled by Servando ─────────────────────────────────────────────────

function HandledTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800">טופל ע״י Servando</h2>
        <p className="text-xs text-slate-400">
          שיחות שנסגרו פנימית על ידי הנציגה — ממוספרות{" "}
          <span className="font-semibold text-violet-600">KXXXX</span> — ללא צורך בפעולה מצדך
        </p>
      </div>

      {/* Legend */}
      <Card className="flex items-start gap-3 p-4">
        <div className="rounded-lg bg-violet-100 p-2 text-violet-600">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="text-sm text-slate-600">
          <span className="font-medium text-slate-700">מה זה אומר?</span> הנציגה שלנו ענתה לשיחה,
          נתנה מידע כללי ללקוח, וסגרה את הפנייה בלי צורך להעבירה אליך. הכל מתועד כאן לנוחיותך.
        </div>
      </Card>

      <TicketList tickets={HANDLED_TICKETS} emptyText="אין תיקים פנימיים החודש" />
    </div>
  );
}

// ─── Tab: Calls ───────────────────────────────────────────────────────────────

function CallsTab() {
  const routingLabel: Record<string, { label: string; color: string }> = {
    servando: { label: "Servando", color: "bg-emerald-50 text-emerald-700" },
    fallback: { label: "Fallback", color: "bg-amber-50 text-amber-700" },
    missed: { label: "לא נענה", color: "bg-red-50 text-red-700" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">היסטוריית שיחות</h2>
          <p className="text-xs text-slate-400">{CALLS.length} שיחות — מרץ 2026</p>
        </div>
        <div className="flex gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Servando ({CALLS.filter((c) => c.routing === "servando").length})
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Fallback ({CALLS.filter((c) => c.routing === "fallback").length})
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            לא נענו ({CALLS.filter((c) => c.routing === "missed").length})
          </span>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {["תאריך", "שעה", "מתקשר", "משך", "ניתוב", "נציגה", "תיק"].map((h) => (
                  <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {CALLS.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-600">{c.date}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{c.time}</td>
                  <td className="px-4 py-3 font-mono text-slate-700" dir="ltr">
                    {c.callerPhone}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">{c.duration}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${routingLabel[c.routing].color}`}>
                      {routingLabel[c.routing].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.agent}</td>
                  <td className="px-4 py-3">
                    {c.ticketId ? <TicketBadge id={c.ticketId} /> : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Tab: Billing ─────────────────────────────────────────────────────────────

function BillingTab() {
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<string | null>(null);
  const colors = minutesColor(BUSINESS.minutesRemaining);

  function handleBuy(pkgId: string) {
    setPurchasing(pkgId);
    setTimeout(() => {
      setPurchasing(null);
      setPurchased(pkgId);
      setTimeout(() => setPurchased(null), 3000);
    }, 1500);
  }

  return (
    <div className="space-y-5">
      {/* Current plan */}
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <SectionTitle>מסלול נוכחי</SectionTitle>
            <p className="text-xl font-bold text-slate-800">מסלול {BUSINESS.plan}</p>
            <p className="mt-1 text-sm text-slate-500">
              {BUSINESS.minutesTotal} דקות / חודש · ₪349 / חודש
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            פעיל
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
          {[
            { label: "דקות שנוצלו", value: BUSINESS.minutesUsed, color: "text-slate-700" },
            { label: "דקות נותרו", value: BUSINESS.minutesRemaining, color: colors.text },
            { label: "מספר Servando", value: BUSINESS.servandoNumber, color: "text-indigo-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className={`mt-1 font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Buy minutes */}
      <div>
        <SectionTitle>רכישת דקות נוספות</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MINUTE_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-xl border p-4 transition ${
                pkg.popular
                  ? "border-indigo-300 bg-indigo-50/60 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-2.5 end-3 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                  פופולרי
                </span>
              )}
              <p className="text-xs font-medium text-slate-500">{pkg.name}</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{pkg.minutes}</p>
              <p className="text-xs text-slate-400">דקות</p>
              <p className="mt-1 text-sm font-semibold text-indigo-600">₪{pkg.price}</p>
              <button
                onClick={() => handleBuy(pkg.id)}
                disabled={!!purchasing}
                className={`mt-3 w-full rounded-lg py-1.5 text-xs font-semibold transition ${
                  pkg.popular
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                } disabled:opacity-50`}
              >
                {purchasing === pkg.id ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    מעבד...
                  </span>
                ) : purchased === pkg.id ? (
                  "✓ נרכש!"
                ) : (
                  "רכוש"
                )}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          דקות נוספות תקפות עד סוף החודש הנוכחי ולא מתגלגלות.
        </p>
      </div>

      {/* Transaction history */}
      <div>
        <SectionTitle>היסטוריית עסקאות</SectionTitle>
        <Card>
          <div className="divide-y divide-slate-50">
            {TRANSACTIONS.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-slate-700">{tx.description}</p>
                  <p className="text-xs text-slate-400">{tx.date} · {tx.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-800">₪{tx.amount}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      tx.status === "paid"
                        ? "bg-emerald-50 text-emerald-700"
                        : tx.status === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {tx.status === "paid" ? "שולם" : tx.status === "pending" ? "ממתין" : "נכשל"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Tab: Business Info ───────────────────────────────────────────────────────

function BusinessInfoTab() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: BUSINESS.name,
    owner: BUSINESS.owner,
    phone: BUSINESS.phone,
    email: BUSINESS.email,
    address: BUSINESS.address,
    website: BUSINESS.website,
    type: BUSINESS.type,
    greetingScript:
      "שלום, הגעתם למספרת רוני. אני נציגת שירות הלקוחות. במה אוכל לסייע לכם?",
    fallbackNumber: BUSINESS.fallbackNumber,
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const fields: { key: keyof typeof form; label: string; type?: string; dir?: string }[] = [
    { key: "name", label: "שם העסק" },
    { key: "owner", label: "שם בעל העסק" },
    { key: "phone", label: "טלפון", dir: "ltr" },
    { key: "email", label: "אימייל", dir: "ltr" },
    { key: "address", label: "כתובת" },
    { key: "website", label: "אתר", dir: "ltr" },
    { key: "type", label: "תחום עסק" },
    { key: "fallbackNumber", label: "מספר Fallback (כשהדקות נגמרות)", dir: "ltr" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">מידע העסק</h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ✏️ עריכה
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-500 transition hover:bg-slate-50"
            >
              ביטול
            </button>
            <button
              form="business-form"
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              שמור
            </button>
          </div>
        )}
      </div>

      {saved && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          ✓ המידע עודכן בהצלחה
        </div>
      )}

      <form id="business-form" onSubmit={handleSave}>
        <Card className="p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">{f.label}</label>
                {editing ? (
                  <input
                    type={f.type ?? "text"}
                    dir={f.dir ?? "auto"}
                    value={form[f.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700" dir={f.dir ?? "auto"}>
                    {form[f.key]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Greeting script — full width */}
        <Card className="mt-4 p-5">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">נוסח מענה (מה הנציגה אומרת בפתיחה)</label>
          {editing ? (
            <textarea
              rows={3}
              value={form.greetingScript}
              onChange={(e) => setForm((prev) => ({ ...prev, greetingScript: e.target.value }))}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          ) : (
            <p className="rounded-lg bg-indigo-50 px-3 py-3 text-sm leading-relaxed text-indigo-900">
              &ldquo;{form.greetingScript}&rdquo;
            </p>
          )}
        </Card>
      </form>
    </div>
  );
}

// ─── Tab: Cancel Request ──────────────────────────────────────────────────────

function CancelTab() {
  const [step, setStep] = useState<"form" | "sent">("form");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const reasons = [
    "מחיר גבוה מדי",
    "לא מרוצה מהשירות",
    "עסק נסגר",
    "מצאתי פתרון אחר",
    "לא זקוק לשירות יותר",
    "אחר",
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("sent");
  }

  if (step === "sent") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✓
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-800">בקשתך התקבלה</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          בקשת הביטול נשלחה לצוות Servando. נציג יצור איתך קשר תוך 2 ימי עסקים לאישור ועיבוד הבקשה.
        </p>
        <button
          onClick={() => setStep("form")}
          className="mt-6 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50"
        >
          חזרה
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <strong>שים לב:</strong> בקשת ביטול תשלח ישירות לצוות ניהול Servando בלבד לבדיקה ועיבוד. ביטול ייכנס לתוקף בתום תקופת החיוב הנוכחית.
      </div>

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">סיבת הביטול</label>
            <div className="space-y-2">
              {reasons.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm text-slate-700">{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              פרטים נוספים (אופציונלי)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="ספר לנו עוד כדי שנוכל לשפר..."
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <button
            type="submit"
            disabled={!reason}
            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            שלח בקשת ביטול
          </button>
        </form>
      </Card>
    </div>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: string; badge?: number }[] = [
  { id: "dashboard", label: "דשבורד", icon: "🏠" },
  {
    id: "my-tickets",
    label: "תיקים שלי",
    icon: "📂",
    badge: MY_TICKETS.filter((t) => t.status !== "closed").length,
  },
  { id: "handled", label: "טופל ע״י Servando", icon: "✅" },
  { id: "calls", label: "שיחות", icon: "📞" },
  { id: "billing", label: "חיובים ודקות", icon: "💳" },
  { id: "business-info", label: "מידע העסק", icon: "🏢" },
  { id: "cancel", label: "בקשת ביטול", icon: "🚪" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientPortalPage() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const colors = minutesColor(BUSINESS.minutesRemaining);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-slate-200 bg-white lg:flex">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-slate-100 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Servando</p>
            <p className="text-[10px] text-slate-400">פורטל לקוח</p>
          </div>
        </div>

        {/* Business identity */}
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-base font-bold text-indigo-600">
              {BUSINESS.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{BUSINESS.name}</p>
              <p className="truncate text-xs text-slate-400">{BUSINESS.owner}</p>
            </div>
          </div>
          {/* Mini minutes indicator */}
          <div className="mt-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">דקות החודש</span>
              <span className={`font-semibold ${colors.text}`}>{BUSINESS.minutesRemaining} נותרו</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-1.5 rounded-full ${colors.bar}`}
                style={{ width: `${Math.round((BUSINESS.minutesRemaining / BUSINESS.minutesTotal) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
                activeTab === tab.id
                  ? "bg-indigo-50 font-semibold text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              } ${tab.id === "cancel" ? "mt-4 text-red-500 hover:bg-red-50 hover:text-red-600" : ""}`}
            >
              <span>{tab.icon}</span>
              <span className="flex-1 text-start">{tab.label}</span>
              {tab.badge != null && tab.badge > 0 && (
                <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="border-t border-slate-100 p-4">
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-1.08a.75.75 0 1 0-1.04-1.08l-2.5 2.5a.75.75 0 0 0 0 1.08l2.5 2.5a.75.75 0 1 0 1.04-1.08l-1.047-1.08H18.25A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
            </svg>
            יציאה
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm">
          <div className="flex items-center gap-2">
            {/* Mobile: current tab name */}
            <span className="text-sm font-semibold text-slate-700 lg:hidden">
              {TABS.find((t) => t.id === activeTab)?.icon}{" "}
              {TABS.find((t) => t.id === activeTab)?.label}
            </span>
            {/* Desktop: breadcrumb */}
            <span className="hidden text-sm text-slate-500 lg:block">
              פורטל לקוח /{" "}
              <span className="font-medium text-slate-700">
                {TABS.find((t) => t.id === activeTab)?.label}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Minutes badge */}
            <span className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 sm:flex ${colors.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${colors.bar}`} />
              {BUSINESS.minutesRemaining} דקות נותרו
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
              {BUSINESS.owner.charAt(0)}
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="flex overflow-x-auto border-b border-slate-200 bg-white px-2 lg:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition ${
                activeTab === tab.id
                  ? "border-b-2 border-indigo-600 text-indigo-700"
                  : "text-slate-500"
              }`}
            >
              {tab.icon} {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "my-tickets" && <MyTicketsTab />}
          {activeTab === "handled" && <HandledTab />}
          {activeTab === "calls" && <CallsTab />}
          {activeTab === "billing" && <BillingTab />}
          {activeTab === "business-info" && <BusinessInfoTab />}
          {activeTab === "cancel" && <CancelTab />}
        </main>
      </div>
    </div>
  );
}
