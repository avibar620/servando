"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CaseType = "lead" | "general" | "schedule" | "owner-msg";
type Priority = "low" | "normal" | "high" | "urgent";
type AiAction = "summarize" | "owner" | "email" | "followup";

interface AiMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  action?: AiAction;
}

// ─── Static mock data ─────────────────────────────────────────────────────────

const BUSINESS = {
  name: "מספרת רוני",
  owner: "רוני לוי",
  phone: "052-555-1234",
  address: "רחוב הרצל 12, תל אביב",
  type: "מספרה ועיצוב שיער",
  minutesBalance: 42,
  greetingScript:
    "שלום, הגעתם למספרת רוני. אני נציגת שירות הלקוחות. במה אוכל לסייע לכם?",
  prices: [
    { service: "תספורת גברים", price: "₪70" },
    { service: "תספורת נשים", price: "₪120–₪180" },
    { service: "צביעה מלאה", price: "₪250–₪350" },
    { service: "גוונים", price: "₪180–₪280" },
    { service: "פן", price: "₪90" },
  ],
  faqs: [
    { q: "האם צריך לקבוע תור?", a: "כן, מומלץ לתאם מראש בטלפון או באפליקציה." },
    { q: "מה שעות הפעילות?", a: "ראשון–חמישי 09:00–20:00, שישי 08:00–14:00." },
    { q: "האם יש חניה?", a: "חניה חופשית ברחוב ובחניון הסמוך." },
  ],
};

const REASON_CODES: Record<CaseType, string[]> = {
  lead: ["מחיר", "זמינות", "שירות ספציפי", "המלצה", "פרסום"],
  general: ["שעות פעילות", "מחירים", "כיוון הגעה", "מדיניות ביטול", "אחר"],
  schedule: ["תור חדש", "שינוי תור", "ביטול תור", "שאלה על תור קיים"],
  "owner-msg": ["בקשת התקשרות", "תלונה", "משוב", "הודעה דחופה", "בקשה עסקית"],
};

const CASE_TABS: { id: CaseType; label: string; icon: string }[] = [
  { id: "lead", label: "ליד חדש", icon: "✨" },
  { id: "general", label: "שאלה כללית", icon: "💬" },
  { id: "schedule", label: "תיאום", icon: "📅" },
  { id: "owner-msg", label: "הודעה לבעלים", icon: "📩" },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low: { label: "נמוכה", color: "bg-slate-100 text-slate-600 ring-slate-200" },
  normal: { label: "רגילה", color: "bg-blue-50 text-blue-700 ring-blue-200" },
  high: { label: "גבוהה", color: "bg-amber-50 text-amber-700 ring-amber-200" },
  urgent: { label: "דחוף", color: "bg-red-50 text-red-700 ring-red-200" },
};

const AI_BUTTONS: { id: AiAction; label: string; icon: string; prompt: string }[] = [
  {
    id: "summarize",
    label: "סכם שיחה",
    icon: "📋",
    prompt: "סיכום השיחה",
  },
  {
    id: "owner",
    label: "הודעה לבעלים",
    icon: "📩",
    prompt: "הודעה לבעל העסק",
  },
  {
    id: "email",
    label: "מייל ללקוח",
    icon: "✉️",
    prompt: "טיוטת מייל ללקוח",
  },
  {
    id: "followup",
    label: "Follow-up",
    icon: "🔔",
    prompt: "הודעת מעקב",
  },
];

const AI_RESPONSES: Record<AiAction, string> = {
  summarize:
    "סיכום שיחה:\n• לקוח התעניין בתספורת נשים ובמחירי צביעה.\n• שאל על זמינות ליום שישי.\n• הביע עניין בקביעת תור לשבוע הבא.\n• טון ידידותי, לא מחויב עדיין.",
  owner:
    "הודעה לרוני לוי:\nלקוח חדש התעניין בשירותי מספרה. שאל על צביעה ומחירים. יש סיכוי טוב לליד. מומלץ להתקשר בחזרה.",
  email:
    "שלום,\n\nתודה שפנית למספרת רוני!\nבמענה לשאלתך, אנו שמחים להציע:\n• תספורת נשים מ-₪120\n• צביעה מלאה מ-₪250\n\nלקביעת תור: 052-555-1234\nנשמח לראותך!",
  followup:
    "הודעת מעקב (ליום שאחרי):\nשלום! זו מספרת רוני. אנחנו רוצים לוודא שקיבלת את כל המידע שחיפשת. האם תרצה לקבוע תור? נשמח לסייע 😊",
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function minutesColor(min: number) {
  if (min > 60) return "text-emerald-600 bg-emerald-50 ring-emerald-200";
  if (min > 30) return "text-amber-600 bg-amber-50 ring-amber-200";
  return "text-red-600 bg-red-50 ring-red-200";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
      {children}
    </h3>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-100 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ─── Left column: Business info ───────────────────────────────────────────────

function BusinessPanel() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const min = BUSINESS.minutesBalance;

  return (
    <div className="flex flex-col gap-3 overflow-y-auto">
      {/* Business header */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-lg font-bold text-indigo-600">
            {BUSINESS.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{BUSINESS.name}</p>
            <p className="text-xs text-slate-500">{BUSINESS.type}</p>
            <p className="mt-0.5 text-xs text-slate-400">{BUSINESS.address}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
          <span className="text-slate-400">בעלים:</span>
          <span className="font-medium">{BUSINESS.owner}</span>
          <span className="ms-auto font-mono text-indigo-600">{BUSINESS.phone}</span>
        </div>
      </Card>

      {/* Minutes balance */}
      <Card>
        <SectionTitle>מאזן דקות</SectionTitle>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">דקות זמינות החודש</span>
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ${minutesColor(min)}`}
          >
            {min} דקות
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
          <div
            className={`h-2 rounded-full transition-all ${
              min > 60 ? "bg-emerald-500" : min > 30 ? "bg-amber-400" : "bg-red-400"
            }`}
            style={{ width: `${Math.min((min / 120) * 100, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-slate-400">מתוך 120 דקות חודשיות</p>
      </Card>

      {/* Greeting script */}
      <Card>
        <SectionTitle>נוסח מענה</SectionTitle>
        <p className="rounded-lg bg-indigo-50 p-3 text-sm leading-relaxed text-indigo-900">
          "{BUSINESS.greetingScript}"
        </p>
      </Card>

      {/* Prices */}
      <Card>
        <SectionTitle>מחירון</SectionTitle>
        <div className="divide-y divide-slate-50">
          {BUSINESS.prices.map((p) => (
            <div key={p.service} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-slate-700">{p.service}</span>
              <span className="text-sm font-semibold text-slate-800">{p.price}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* FAQs */}
      <Card>
        <SectionTitle>שאלות נפוצות</SectionTitle>
        <div className="space-y-1">
          {BUSINESS.faqs.map((f, i) => (
            <div key={i} className="rounded-lg border border-slate-100">
              <button
                className="flex w-full items-center justify-between p-2.5 text-start text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {f.q}
                <span className="ms-2 text-slate-400 transition-transform">
                  {openFaq === i ? "▲" : "▼"}
                </span>
              </button>
              {openFaq === i && (
                <p className="border-t border-slate-100 px-2.5 pb-2.5 pt-2 text-xs leading-relaxed text-slate-600">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Middle column: Case form ─────────────────────────────────────────────────

function CasePanel() {
  const [caseType, setCaseType] = useState<CaseType>("lead");
  const [priority, setPriority] = useState<Priority>("normal");
  const [reasonCode, setReasonCode] = useState("");
  const [escalate, setEscalate] = useState(false);
  const [saved, setSaved] = useState(false);

  // Dynamic form state
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [ownerMsgText, setOwnerMsgText] = useState("");

  const reasons = REASON_CODES[caseType];

  useEffect(() => {
    setReasonCode("");
  }, [caseType]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto">
      {/* Case type selector */}
      <Card>
        <SectionTitle>סוג תיק</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          {CASE_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setCaseType(t.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                caseType === t.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Dynamic form */}
      <Card>
        <form onSubmit={handleSave} className="space-y-3">
          <SectionTitle>פרטי תיק — {CASE_TABS.find((t) => t.id === caseType)?.label}</SectionTitle>

          {/* Common fields */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">שם המתקשר</label>
              <input
                type="text"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                placeholder="ישראל ישראלי"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">טלפון</label>
              <input
                type="tel"
                value={callerPhone}
                onChange={(e) => setCallerPhone(e.target.value)}
                placeholder="05X-XXX-XXXX"
                dir="ltr"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Scheduling fields */}
          {caseType === "schedule" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">תאריך מועדף</label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">שעה מועדפת</label>
                <input
                  type="time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          )}

          {/* Owner message field */}
          {caseType === "owner-msg" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">תוכן ההודעה לבעלים</label>
              <textarea
                rows={3}
                value={ownerMsgText}
                onChange={(e) => setOwnerMsgText(e.target.value)}
                placeholder="כתוב את ההודעה לבעל העסק..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 resize-none"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">הערות</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="פרטים נוספים שעלו בשיחה..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 resize-none"
            />
          </div>

          {/* Reason code */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">סיבת פניה (Reason Code)</label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">— בחר סיבה —</option>
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">עדיפות</label>
            <div className="flex gap-1.5 flex-wrap">
              {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition-all ${
                    priority === p
                      ? PRIORITY_CONFIG[p].color + " ring-2 font-semibold"
                      : "bg-slate-50 text-slate-500 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Escalate checkbox */}
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <input
              type="checkbox"
              checked={escalate}
              onChange={(e) => setEscalate(e.target.checked)}
              className="h-4 w-4 rounded accent-amber-500"
            />
            <span className="text-sm font-medium text-amber-800">הפנה לבעל העסק לטיפול</span>
            {escalate && (
              <span className="ms-auto text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                פעיל
              </span>
            )}
          </label>

          {/* Save button */}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.99]"
          >
            {saved ? (
              <>
                <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                נשמר בהצלחה!
              </>
            ) : (
              "שמור תיק"
            )}
          </button>
        </form>
      </Card>
    </div>
  );
}

// ─── Right column: AI + Timer ─────────────────────────────────────────────────

function AiPanel() {
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [loadingAction, setLoadingAction] = useState<AiAction | null>(null);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive]);

  const triggerAi = useCallback((action: AiAction) => {
    const btn = AI_BUTTONS.find((b) => b.id === action)!;
    setLoadingAction(action);
    const userMsg: AiMessage = {
      id: Date.now(),
      role: "user",
      text: btn.prompt,
      action,
    };
    setMessages((prev) => [...prev, userMsg]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", text: AI_RESPONSES[action] },
      ]);
      setLoadingAction(null);
    }, 1200);
  }, []);

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim()) return;
    const userMsg: AiMessage = { id: Date.now(), role: "user", text: inputText };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoadingAction("summarize");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "אני מעבד את בקשתך... ניתוח על בסיס נתוני העסק זמין לי. כיצד אוכל לסייע נוספות?",
        },
      ]);
      setLoadingAction(null);
    }, 1000);
  }

  const timerColor =
    seconds < 120 ? "text-emerald-600" : seconds < 300 ? "text-amber-600" : "text-red-600";

  return (
    <div className="flex flex-col gap-3 overflow-y-auto">
      {/* Call timer */}
      <Card>
        <SectionTitle>טיימר שיחה</SectionTitle>
        <div className="flex items-center justify-between">
          <div className={`font-mono text-3xl font-bold tabular-nums ${timerColor}`}>
            {formatTime(seconds)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimerActive((v) => !v)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                timerActive
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              }`}
            >
              {timerActive ? "⏸ עצור" : "▶ התחל"}
            </button>
            <button
              onClick={() => { setSeconds(0); setTimerActive(false); }}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              ↺ איפוס
            </button>
          </div>
        </div>
        {/* Status indicator */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <span className={`h-2 w-2 rounded-full ${timerActive ? "bg-emerald-400 animate-pulse" : "bg-slate-300"}`} />
          {timerActive ? "שיחה פעילה" : "שיחה לא פעילה"}
          {seconds > 0 && (
            <span className="ms-auto text-slate-400">
              {Math.floor(seconds / 60)} דקות {seconds % 60} שניות
            </span>
          )}
        </div>
      </Card>

      {/* Call details */}
      <Card>
        <SectionTitle>פרטי שיחה</SectionTitle>
        <div className="space-y-1.5 text-sm">
          {[
            { label: "מספר מתקשר", value: "+972-52-555-9876" },
            { label: "נכנסת בשעה", value: "14:32" },
            { label: "מקור שיחה", value: "טלפון ישיר" },
            { label: "נציגה", value: "דנה כהן" },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <span className="text-slate-500">{r.label}</span>
              <span className="font-medium text-slate-800" dir="ltr">{r.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* AI quick actions */}
      <Card>
        <SectionTitle>עוזר AI</SectionTitle>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {AI_BUTTONS.map((btn) => (
            <button
              key={btn.id}
              onClick={() => triggerAi(btn.id)}
              disabled={loadingAction !== null}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAction === btn.id ? (
                <svg className="h-3.5 w-3.5 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <span>{btn.icon}</span>
              )}
              {btn.label}
            </button>
          ))}
        </div>

        {/* Chat window */}
        <div className="flex flex-col gap-2 max-h-52 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-2">
          {messages.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">
              לחץ על אחד מהכפתורים לקבלת עזרה מה-AI
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                  m.role === "user"
                    ? "self-start bg-indigo-600 text-white"
                    : "self-stretch bg-white text-slate-700 border border-slate-100 shadow-sm"
                }`}
              >
                {m.text}
              </div>
            ))
          )}
          {loadingAction && messages[messages.length - 1]?.role === "user" && (
            <div className="self-stretch rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>

        {/* Free-text input */}
        <form onSubmit={handleSendMessage} className="mt-2 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="שאל את ה-AI..."
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loadingAction !== null}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-40"
          >
            שלח
          </button>
        </form>
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentWorkspacePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <span className="font-semibold text-slate-800">Servando</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500 font-medium">
            Agent Workspace
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">שלום, דנה</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
            ד
          </div>
        </div>
      </header>

      {/* Three-column layout */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left — Business info */}
        <aside className="w-72 shrink-0 overflow-y-auto border-e border-slate-200 bg-white p-4">
          <BusinessPanel />
        </aside>

        {/* Center — Case form */}
        <section className="flex-1 overflow-y-auto p-4">
          <CasePanel />
        </section>

        {/* Right — AI + Timer */}
        <aside className="w-72 shrink-0 overflow-y-auto border-s border-slate-200 bg-white p-4">
          <AiPanel />
        </aside>
      </main>
    </div>
  );
}
