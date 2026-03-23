"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketTab = "details" | "tasks" | "ai" | "call" | "history";
type Priority = "low" | "normal" | "high" | "urgent";
type TicketStatus = "open" | "in-progress" | "closed";
type Visibility = "owner" | "internal" | "referred";
type TaskStatus = "todo" | "done";
type AiAction = "summary" | "owner-msg" | "email" | "followup";

interface Task {
  id: string;
  text: string;
  status: TaskStatus;
  assignedTo: string;
  dueDate: string;
}

interface AiOutput {
  action: AiAction;
  label: string;
  icon: string;
  content: string;
  generatedAt: string;
}

interface HistoryEntry {
  id: string;
  ts: string;
  actor: string;
  action: string;
  detail?: string;
  type: "create" | "update" | "ai" | "note" | "close";
}

// ─── Mock tickets DB ──────────────────────────────────────────────────────────

const TICKETS: Record<
  string,
  {
    id: string;
    type: "referred" | "internal";
    subject: string;
    status: TicketStatus;
    priority: Priority;
    visibility: Visibility;
    createdAt: string;
    businessName: string;
    businessType: string;
    callerName: string;
    callerPhone: string;
    callerEmail: string;
    notes: string;
    agent: string;
    reasonCode: string;
    callDuration: string;
    callStart: string;
    tasks: Task[];
    aiOutputs: AiOutput[];
    history: HistoryEntry[];
  }
> = {
  "2256": {
    id: "#2256",
    type: "referred",
    subject: "לקוח מעוניין בצביעת שיער",
    status: "open",
    priority: "high",
    visibility: "referred",
    createdAt: "22/03/2026 14:32",
    businessName: "מספרת רוני",
    businessType: "מספרה ועיצוב שיער",
    callerName: "שרה כהן",
    callerPhone: "050-111-2222",
    callerEmail: "sarah@example.com",
    notes:
      "לקוחה שאלה על מחירי צביעה מלאה וגוונים. מעוניינת לקבוע תור לשבוע הבא. ציינה שהיא לקוחה ותיקה.",
    agent: "דנה כהן",
    reasonCode: "ליד חדש",
    callDuration: "3:41",
    callStart: "14:32",
    tasks: [
      { id: "t1", text: "להחזיר טלפון ללקוחה", status: "todo", assignedTo: "רוני לוי", dueDate: "23/03/2026" },
      { id: "t2", text: "לשלוח מחירון עדכני", status: "todo", assignedTo: "רוני לוי", dueDate: "23/03/2026" },
      { id: "t3", text: "לבדוק זמינות ביום שלישי", status: "done", assignedTo: "רוני לוי", dueDate: "22/03/2026" },
    ],
    aiOutputs: [
      {
        action: "summary",
        label: "סיכום שיחה",
        icon: "📋",
        content:
          "סיכום שיחה:\n• לקוחה שרה כהן התעניינה בצביעת שיער מלאה וגוונים.\n• שאלה על מחירים ואמרה שהיא לקוחה ותיקה.\n• ביקשה לקבוע תור לשבוע הבא, עדיפות יום שלישי.\n• טון ידידותי, סיכוי גבוה לסגירה.",
        generatedAt: "14:33",
      },
      {
        action: "owner-msg",
        label: "הודעה לבעלים",
        icon: "📩",
        content:
          "שלום רוני,\n\nלקוחה ותיקה — שרה כהן (050-111-2222) — התקשרה ושאלה על צביעה מלאה וגוונים. מעוניינת לקבוע תור לשבוע הבא, עדיפות יום שלישי.\n\nמומלץ להתקשר אליה בחזרה.\n\nServando",
        generatedAt: "14:33",
      },
      {
        action: "email",
        label: "מייל ללקוח",
        icon: "✉️",
        content:
          "שלום שרה,\n\nתודה שפנית למספרת רוני!\n\nאנו שמחים לדעת שאת מתעניינת בשירותי הצביעה שלנו:\n• צביעה מלאה: ₪250–₪350\n• גוונים: ₪180–₪280\n\nנשמח לתאם לך תור מוקדם. ניצור איתך קשר בקרוב.\n\nמספרת רוני",
        generatedAt: "14:34",
      },
      {
        action: "followup",
        label: "Follow-up",
        icon: "🔔",
        content:
          "הודעת מעקב (ליום שאחרי):\nשלום שרה! זו מספרת רוני. רצינו לוודא שקיבלת את כל המידע שחיפשת בנוגע לצביעה. האם תרצי לקבוע תור? נשמח לראותך 😊",
        generatedAt: "14:34",
      },
    ],
    history: [
      { id: "h1", ts: "22/03/2026 14:32", actor: "דנה כהן", action: "תיק נוצר", type: "create" },
      { id: "h2", ts: "22/03/2026 14:33", actor: "AI", action: "סיכום שיחה נוצר", type: "ai" },
      { id: "h3", ts: "22/03/2026 14:33", actor: "AI", action: "הודעה לבעלים נוצרה", type: "ai" },
      { id: "h4", ts: "22/03/2026 14:34", actor: "AI", action: "מייל ו-follow-up נוצרו", type: "ai" },
      { id: "h5", ts: "22/03/2026 14:35", actor: "דנה כהן", action: "3 משימות נוספו לתיק", type: "update" },
      { id: "h6", ts: "22/03/2026 15:10", actor: "דנה כהן", action: "משימה סומנה כבוצע", detail: "בדוק זמינות יום שלישי", type: "update" },
    ],
  },
  K2549: {
    id: "K2549",
    type: "internal",
    subject: "שאלה כללית על שעות פעילות",
    status: "closed",
    priority: "low",
    visibility: "internal",
    createdAt: "22/03/2026 13:10",
    businessName: "מספרת רוני",
    businessType: "מספרה ועיצוב שיער",
    callerName: "אבי גולן",
    callerPhone: "050-555-6666",
    callerEmail: "",
    notes: "לקוח שאל על שעות הפעילות של המספרה בחג. ענינו לו בהתאם למידע העסק.",
    agent: "דנה כהן",
    reasonCode: "שאלה כללית",
    callDuration: "1:55",
    callStart: "13:10",
    tasks: [],
    aiOutputs: [
      {
        action: "summary",
        label: "סיכום שיחה",
        icon: "📋",
        content: "לקוח שאל על שעות פעילות בחג. נמסר מידע לפי Knowledge Base של העסק. תיק נסגר פנימית.",
        generatedAt: "13:11",
      },
    ],
    history: [
      { id: "h1", ts: "22/03/2026 13:10", actor: "דנה כהן", action: "תיק פנימי נוצר", type: "create" },
      { id: "h2", ts: "22/03/2026 13:11", actor: "AI", action: "סיכום שיחה נוצר", type: "ai" },
      { id: "h3", ts: "22/03/2026 13:12", actor: "דנה כהן", action: "תיק נסגר פנימית", type: "close" },
    ],
  },
};

// ─── Static config ────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low: { label: "נמוכה", color: "bg-slate-100 text-slate-600" },
  normal: { label: "רגילה", color: "bg-blue-50 text-blue-700" },
  high: { label: "גבוהה", color: "bg-amber-50 text-amber-700" },
  urgent: { label: "דחוף", color: "bg-red-50 text-red-700" },
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; dot: string }> = {
  open: { label: "פתוח", color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  "in-progress": { label: "בטיפול", color: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-500" },
  closed: { label: "סגור", color: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

const HISTORY_ICONS: Record<string, string> = {
  create: "🆕",
  update: "✏️",
  ai: "🤖",
  note: "📝",
  close: "✅",
};

// ─── Shared components ────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-100 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function TicketBadge({ id }: { id: string }) {
  const isInternal = id.startsWith("K");
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
      isInternal ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200" : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
    }`}>
      {id}
    </span>
  );
}

// ─── Tab: Details ────────────────────────────────────────────────────────────

function DetailsTab({ ticket, onUpdate }: {
  ticket: (typeof TICKETS)[string];
  onUpdate: (patch: Partial<typeof ticket>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    callerName: ticket.callerName,
    callerPhone: ticket.callerPhone,
    callerEmail: ticket.callerEmail,
    notes: ticket.notes,
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    onUpdate(form);
    setEditing(false);
  }

  const VISIBILITY_OPTIONS: { val: Visibility; label: string; desc: string }[] = [
    { val: "referred", label: "הופנה לבעל העסק", desc: "גלוי בפורטל הלקוח" },
    { val: "internal", label: "טופל פנימית", desc: "לא גלוי לבעל העסק" },
    { val: "owner", label: "גלוי לבעל העסק", desc: "גלוי בפורטל הלקוח" },
  ];

  return (
    <div className="space-y-4">
      {/* Caller info */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">פרטי מתקשר</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
              ✏️ עריכה
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-400 hover:bg-slate-50">ביטול</button>
              <button form="details-form" type="submit" className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700">שמור</button>
            </div>
          )}
        </div>
        <form id="details-form" onSubmit={handleSave}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { key: "callerName" as const, label: "שם", dir: "auto" },
              { key: "callerPhone" as const, label: "טלפון", dir: "ltr" },
              { key: "callerEmail" as const, label: "אימייל", dir: "ltr" },
            ].map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-slate-500">{f.label}</label>
                {editing ? (
                  <input
                    type="text"
                    dir={f.dir}
                    value={form[f.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700" dir={f.dir}>
                    {form[f.key] || <span className="text-slate-300">—</span>}
                  </p>
                )}
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">הערות שיחה</label>
              {editing ? (
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              ) : (
                <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
                  {form.notes}
                </p>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* Visibility */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">הגדרות חשיפה</h3>
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map((opt) => (
            <label key={opt.val} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
              ticket.visibility === opt.val ? "border-indigo-300 bg-indigo-50/60" : "border-slate-100 hover:bg-slate-50"
            }`}>
              <input
                type="radio"
                name="visibility"
                value={opt.val}
                checked={ticket.visibility === opt.val}
                onChange={() => onUpdate({ visibility: opt.val })}
                className="mt-0.5 accent-indigo-600"
              />
              <div>
                <p className="text-sm font-medium text-slate-700">{opt.label}</p>
                <p className="text-xs text-slate-400">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* Status + Priority */}
      <Card className="p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">סטטוס</h3>
            <div className="space-y-1.5">
              {(Object.keys(STATUS_CONFIG) as TicketStatus[]).map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="radio"
                    name="status"
                    checked={ticket.status === s}
                    onChange={() => onUpdate({ status: s })}
                    className="accent-indigo-600"
                  />
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CONFIG[s].color}`}>
                    {STATUS_CONFIG[s].label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">עדיפות</h3>
            <div className="space-y-1.5">
              {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                <label key={p} className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="radio"
                    name="priority"
                    checked={ticket.priority === p}
                    onChange={() => onUpdate({ priority: p })}
                    className="accent-indigo-600"
                  />
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_CONFIG[p].color}`}>
                    {PRIORITY_CONFIG[p].label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Tab: Tasks ───────────────────────────────────────────────────────────────

function TasksTab({ tasks, onUpdate }: {
  tasks: Task[];
  onUpdate: (tasks: Task[]) => void;
}) {
  const [newText, setNewText] = useState("");
  const [newAssignee, setNewAssignee] = useState("רוני לוי");
  const [newDue, setNewDue] = useState("");

  const AGENTS = ["רוני לוי", "דנה כהן", "יעל שמש"];

  function toggle(id: string) {
    onUpdate(tasks.map((t) => t.id === id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t));
  }

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    onUpdate([
      ...tasks,
      { id: `t${Date.now()}`, text: newText.trim(), status: "todo", assignedTo: newAssignee, dueDate: newDue },
    ]);
    setNewText("");
    setNewDue("");
  }

  function remove(id: string) {
    onUpdate(tasks.filter((t) => t.id !== id));
  }

  const open = tasks.filter((t) => t.status === "todo");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-4">
      {/* Add task form */}
      <Card className="p-4">
        <form onSubmit={addTask} className="flex flex-wrap gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="משימה חדשה..."
            className="flex-1 min-w-[180px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
          <select
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          >
            {AGENTS.map((a) => <option key={a}>{a}</option>)}
          </select>
          <input
            type="date"
            value={newDue}
            onChange={(e) => setNewDue(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            + הוסף
          </button>
        </form>
      </Card>

      {/* Open tasks */}
      {open.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            פתוח ({open.length})
          </div>
          <div className="divide-y divide-slate-50">
            {open.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => toggle(t.id)}
                  className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{t.text}</p>
                  <p className="text-xs text-slate-400">{t.assignedTo}{t.dueDate ? ` · ${t.dueDate}` : ""}</p>
                </div>
                <button onClick={() => remove(t.id)} className="shrink-0 rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Done tasks */}
      {done.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            בוצע ({done.length})
          </div>
          <div className="divide-y divide-slate-50">
            {done.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 opacity-60">
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => toggle(t.id)}
                  className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-500 line-through">{t.text}</p>
                  <p className="text-xs text-slate-400">{t.assignedTo}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tasks.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <span className="text-3xl">📋</span>
          <p className="mt-2 text-sm text-slate-400">אין משימות עדיין. הוסף משימה למעלה.</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: AI outputs ─────────────────────────────────────────────────────────

function AiTab({ outputs }: { outputs: AiOutput[] }) {
  const [regenerating, setRegenerating] = useState<AiAction | null>(null);
  const [copied, setCopied] = useState<AiAction | null>(null);

  function regenerate(action: AiAction) {
    setRegenerating(action);
    setTimeout(() => setRegenerating(null), 1500);
  }

  function copy(action: AiAction, text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(action);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-4">
      {outputs.map((out) => (
        <Card key={out.action} className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{out.icon}</span>
              <h3 className="text-sm font-semibold text-slate-700">{out.label}</h3>
              <span className="text-xs text-slate-400">נוצר {out.generatedAt}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copy(out.action, out.content)}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                {copied === out.action ? "✓ הועתק" : "העתק"}
              </button>
              <button
                onClick={() => regenerate(out.action)}
                disabled={regenerating === out.action}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60"
              >
                {regenerating === out.action ? (
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : "↺"} צור מחדש
              </button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 font-sans">
            {out.content}
          </pre>
        </Card>
      ))}

      {outputs.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <span className="text-3xl">🤖</span>
          <p className="mt-2 text-sm text-slate-400">אין AI outputs לתיק זה עדיין.</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Call ────────────────────────────────────────────────────────────────

function CallTab({ ticket }: { ticket: (typeof TICKETS)[string] }) {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-700">פרטי שיחה</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "מספר מתקשר", value: ticket.callerPhone, dir: "ltr" },
            { label: "שעת שיחה", value: ticket.callStart },
            { label: "משך שיחה", value: ticket.callDuration, dir: "ltr" },
            { label: "נציגה", value: ticket.agent },
            { label: "Reason Code", value: ticket.reasonCode },
            { label: "ניתוב", value: "Servando" },
          ].map((f) => (
            <div key={f.label} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">{f.label}</p>
              <p className="mt-0.5 text-sm font-medium text-slate-700" dir={(f as { dir?: string }).dir ?? "auto"}>
                {f.value}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Audio placeholder */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">הקלטת שיחה</h3>
        <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
          <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition">
            ▶
          </button>
          <div className="flex-1">
            <div className="h-1.5 w-full rounded-full bg-slate-200">
              <div className="h-1.5 w-1/3 rounded-full bg-indigo-500" />
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>1:14</span>
              <span>{ticket.callDuration}</span>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">* הקלטה זמינה ל-30 יום</p>
      </Card>
    </div>
  );
}

// ─── Tab: History ─────────────────────────────────────────────────────────────

function HistoryTab({ history }: { history: HistoryEntry[] }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">Timeline — היסטוריית פעולות</h3>
      <div className="relative ps-6">
        {/* Vertical line */}
        <div className="absolute start-2 top-2 bottom-2 w-0.5 bg-slate-100" />

        <div className="space-y-4">
          {[...history].reverse().map((entry, i) => (
            <div key={entry.id} className="relative flex gap-3">
              {/* Dot */}
              <div className="absolute -start-4 mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-white bg-white text-[10px] shadow-sm ring-1 ring-slate-200">
                {HISTORY_ICONS[entry.type]}
              </div>
              <div className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3.5 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700">{entry.action}</p>
                  <span className="shrink-0 text-xs text-slate-400">{entry.ts}</span>
                </div>
                <p className="text-xs text-slate-400">{entry.actor}</p>
                {entry.detail && <p className="mt-1 text-xs text-slate-500">{entry.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { id: TicketTab; label: string }[] = [
  { id: "details", label: "פרטי תיק" },
  { id: "tasks", label: "משימות" },
  { id: "ai", label: "AI Outputs" },
  { id: "call", label: "שיחה" },
  { id: "history", label: "היסטוריה" },
];

export default function TicketDetailsPage() {
  const params = useParams();
  const rawId = typeof params.id === "string" ? params.id : "";
  const ticketKey = rawId.replace(/^%23/, "#").replace(/^#/, "");

  const [ticket, setTicket] = useState(
    TICKETS[ticketKey] ?? TICKETS[`K${ticketKey}`] ?? TICKETS["2256"]
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Try fetching with # prefix first, then K prefix, then raw
        const candidates = [
          `%23${ticketKey}`,      // #XXXX
          `K${ticketKey}`,        // KXXXX
          ticketKey,              // raw
        ];

        for (const id of candidates) {
          const res = await fetch(`/api/tickets/${id}`);
          if (res.ok) {
            const { ticket: t } = await res.json();
            // Map API response to local shape
            const statusMap: Record<string, TicketStatus> = { OPEN: "open", IN_PROGRESS: "in-progress", CLOSED: "closed" };
            const prioMap: Record<string, Priority> = { LOW: "low", NORMAL: "normal", HIGH: "high", URGENT: "urgent" };
            const fmtDate = (iso: string) => {
              const d = new Date(iso);
              return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            };

            setTicket({
              id: t.displayId,
              type: t.type === "REFERRED" ? "referred" : "internal",
              subject: t.subject,
              status: statusMap[t.status] ?? "open",
              priority: prioMap[t.priority] ?? "normal",
              visibility: t.type === "REFERRED" ? "referred" : "internal",
              createdAt: fmtDate(t.createdAt),
              businessName: t.business?.name ?? "",
              businessType: "",
              callerName: t.callerName ?? "",
              callerPhone: t.callerPhone ?? "",
              callerEmail: t.callerEmail ?? "",
              notes: t.notes ?? t.aiSummary ?? "",
              agent: t.agent?.name ?? "",
              reasonCode: t.reasonCode ?? "",
              callDuration: "",
              callStart: "",
              tasks: (t.tasks ?? []).map((tk: { id: string; text: string; status: string; assignee?: { name: string }; dueDate?: string }) => ({
                id: tk.id,
                text: tk.text,
                status: tk.status === "DONE" ? "done" : "todo",
                assignedTo: tk.assignee?.name ?? "",
                dueDate: tk.dueDate ? fmtDate(tk.dueDate) : "",
              })),
              aiOutputs: (t.aiOutputs ?? []).map((a: { action: string; label: string; content: string; generatedAt: string }) => ({
                action: a.action as AiAction,
                label: a.label,
                icon: a.action === "summary" ? "📋" : a.action === "owner-msg" ? "📩" : a.action === "email" ? "✉️" : "🔔",
                content: a.content,
                generatedAt: fmtDate(a.generatedAt),
              })),
              history: (t.history ?? []).map((h: { id: string; createdAt: string; actor: string; action: string; detail?: string }, i: number) => ({
                id: h.id ?? `h${i}`,
                ts: fmtDate(h.createdAt),
                actor: h.actor,
                action: h.action === "create" ? "תיק נוצר" : h.detail ?? h.action,
                detail: h.detail,
                type: h.action as "create" | "update" | "ai" | "note" | "close",
              })),
            });
            break;
          }
        }
      } catch (err) {
        console.error("Failed to fetch ticket:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ticketKey]);

  function updateTicket(patch: Partial<typeof ticket>) {
    setTicket((prev) => ({ ...prev, ...patch }));
  }

  const [activeTab, setActiveTab] = useState<TicketTab>("details");

  const taskCount = ticket.tasks.filter((t) => t.status === "todo").length;
  const isInternal = ticket.id.startsWith("K");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm">טוען כרטיס...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-6 shadow-sm">
        <button
          onClick={() => window.history.back()}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-slate-700">Servando</span>
        <span className="text-slate-300">/</span>
        <TicketBadge id={ticket.id} />
        <span className="hidden truncate text-sm text-slate-500 sm:block">{ticket.subject}</span>
      </header>

      <div className="flex">
        {/* Main content */}
        <div className="flex-1 p-5">
          {/* Tabs */}
          <div className="mb-5 flex gap-0 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-5 py-3 text-sm font-medium transition ${
                  activeTab === t.id
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
                {t.id === "tasks" && taskCount > 0 && (
                  <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {taskCount}
                  </span>
                )}
                {t.id === "ai" && (
                  <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-600">
                    {ticket.aiOutputs.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "details" && <DetailsTab ticket={ticket} onUpdate={updateTicket} />}
          {activeTab === "tasks" && (
            <TasksTab
              tasks={ticket.tasks}
              onUpdate={(tasks) => updateTicket({ tasks })}
            />
          )}
          {activeTab === "ai" && <AiTab outputs={ticket.aiOutputs} />}
          {activeTab === "call" && <CallTab ticket={ticket} />}
          {activeTab === "history" && <HistoryTab history={ticket.history} />}
        </div>

        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-s border-slate-200 bg-white p-5 lg:block">
          {/* Ticket meta */}
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">מזהה תיק</p>
              <TicketBadge id={ticket.id} />
              <p className="mt-1.5 text-xs text-slate-400">{ticket.createdAt}</p>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">עסק</p>
              <p className="text-sm font-medium text-slate-700">{ticket.businessName}</p>
              <p className="text-xs text-slate-400">{ticket.businessType}</p>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">סטטוס</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CONFIG[ticket.status].color}`}>
                {STATUS_CONFIG[ticket.status].label}
              </span>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">עדיפות</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_CONFIG[ticket.priority].color}`}>
                {PRIORITY_CONFIG[ticket.priority].label}
              </span>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">נציגה</p>
              <p className="text-sm text-slate-700">{ticket.agent}</p>
            </div>

            {isInternal && (
              <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-700">
                תיק פנימי — טופל ע״י Servando
              </div>
            )}

            <div className="border-t border-slate-100 pt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">פעולות מהירות</p>
              <div className="space-y-1.5">
                {[
                  { label: "שלח מייל ללקוח", icon: "✉️" },
                  { label: "שלח הודעה לבעלים", icon: "📩" },
                  { label: "סגור תיק", icon: "✅" },
                ].map((a) => (
                  <button
                    key={a.label}
                    onClick={() => {
                      if (a.label === "סגור תיק") updateTicket({ status: "closed" });
                    }}
                    className="flex w-full items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
                  >
                    <span>{a.icon}</span> {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
