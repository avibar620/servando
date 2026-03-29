"use client";

import { useState, useEffect, useCallback } from "react";
import LogoutButton from "@/components/LogoutButton";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "bug" | "suggestion" | "training" | "tools" | "client" | "other";
type Status = "open" | "in-review" | "resolved" | "declined";
type Priority = "low" | "medium" | "high";
type View = "board" | "stats";

interface FeedbackItem {
  id: string;
  agentName: string;
  category: Category;
  priority: Priority;
  status: Status;
  title: string;
  body: string;
  submittedAt: string;
  adminReply?: string;
  adminRepliedAt?: string;
  upvotes: number;
  upvotedByMe?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CURRENT_USER_ID = "current-user"; // TODO: replace with real auth user id

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const time = date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });

  if (diffDays === 0) return `היום ${time}`;
  if (diffDays === 1) return `אתמול ${time}`;
  return `${date.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })} ${time}`;
}

interface ApiItem {
  id: string;
  authorId: string;
  author: { name: string };
  category: string;
  priority: string;
  status: string;
  title: string;
  body: string;
  adminReply: string | null;
  adminRepliedAt: string | null;
  upvotes: number;
  submittedAt: string;
  upvoters: { userId: string }[];
}

function mapApiItem(item: ApiItem): FeedbackItem {
  return {
    id: item.id,
    agentName: item.author.name,
    category: item.category.toLowerCase() as Category,
    priority: item.priority.toLowerCase() as Priority,
    status: item.status.toLowerCase().replace("_", "-") as Status,
    title: item.title,
    body: item.body,
    submittedAt: formatDate(item.submittedAt),
    adminReply: item.adminReply ?? undefined,
    adminRepliedAt: item.adminRepliedAt ? formatDate(item.adminRepliedAt) : undefined,
    upvotes: item.upvotes,
    upvotedByMe: item.upvoters.some((u) => u.userId === CURRENT_USER_ID),
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<Category, { label: string; color: string; icon: string }> = {
  bug: { label: "באג", color: "bg-red-100 text-red-700", icon: "🐛" },
  suggestion: { label: "הצעה", color: "bg-indigo-100 text-indigo-700", icon: "💡" },
  training: { label: "הדרכה", color: "bg-amber-100 text-amber-700", icon: "📚" },
  tools: { label: "כלים", color: "bg-purple-100 text-purple-700", icon: "🔧" },
  client: { label: "לקוח", color: "bg-emerald-100 text-emerald-700", icon: "🏢" },
  other: { label: "אחר", color: "bg-gray-100 text-gray-600", icon: "📝" },
};

const STATUS_META: Record<Status, { label: string; color: string }> = {
  open: { label: "פתוח", color: "bg-sky-100 text-sky-700" },
  "in-review": { label: "בבדיקה", color: "bg-amber-100 text-amber-700" },
  resolved: { label: "טופל", color: "bg-emerald-100 text-emerald-700" },
  declined: { label: "נדחה", color: "bg-gray-100 text-gray-500" },
};

const PRIORITY_META: Record<Priority, { label: string; dot: string }> = {
  high: { label: "גבוה", dot: "bg-red-500" },
  medium: { label: "בינוני", dot: "bg-amber-400" },
  low: { label: "נמוך", dot: "bg-gray-300" },
};

// ─── Stats View ───────────────────────────────────────────────────────────────

function StatsView({ items }: { items: FeedbackItem[] }) {
  // By category
  const byCategory = Object.entries(CATEGORY_META).map(([key, meta]) => ({
    key: key as Category,
    meta,
    count: items.filter((i) => i.category === key).length,
  }));

  // By status
  const byStatus = Object.entries(STATUS_META).map(([key, meta]) => ({
    key: key as Status,
    meta,
    count: items.filter((i) => i.status === key).length,
  }));

  // By agent
  const agentMap: Record<string, number> = {};
  items.forEach((i) => {
    agentMap[i.agentName] = (agentMap[i.agentName] ?? 0) + 1;
  });
  const byAgent = Object.entries(agentMap).sort((a, b) => b[1] - a[1]);

  const maxAgent = Math.max(...byAgent.map((a) => a[1]));
  const maxCat = Math.max(...byCategory.map((c) => c.count));

  const resolved = items.filter((i) => i.status === "resolved").length;
  const resRate = items.length ? Math.round((resolved / items.length) * 100) : 0;
  const avgUpvotes = items.length
    ? Math.round(items.reduce((s, i) => s + i.upvotes, 0) / items.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "סה״כ פניות", value: items.length },
          { label: "פתוחות", value: items.filter((i) => i.status === "open").length },
          { label: "אחוז טיפול", value: `${resRate}%` },
          { label: "ממוצע אהבות", value: avgUpvotes },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By category */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">לפי קטגוריה</h3>
          <div className="space-y-2">
            {byCategory.filter((c) => c.count > 0).sort((a, b) => b.count - a.count).map((c) => (
              <div key={c.key} className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-600 flex items-center gap-1">
                  {c.meta.icon} {c.meta.label}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-indigo-500"
                    style={{ width: maxCat ? `${(c.count / maxCat) * 100}%` : "0%" }}
                  />
                </div>
                <span className="w-5 text-end text-xs text-gray-500 font-medium">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">לפי סטטוס</h3>
          <div className="flex flex-wrap gap-3">
            {byStatus.map((s) => (
              <div
                key={s.key}
                className="flex-1 min-w-[100px] rounded-lg border border-gray-200 p-3 text-center"
              >
                <p className="text-2xl font-bold text-gray-900">{s.count}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.meta.color}`}>
                  {s.meta.label}
                </span>
              </div>
            ))}
          </div>

          {/* Resolution rate bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>אחוז טיפול</span>
              <span className="font-semibold text-emerald-600">{resRate}%</span>
            </div>
            <div className="bg-gray-100 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full bg-emerald-500"
                style={{ width: `${resRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* By agent */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">לפי נציג</h3>
          <div className="space-y-2">
            {byAgent.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-28 text-sm text-gray-700 font-medium">{name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-violet-500"
                    style={{ width: maxAgent ? `${(count / maxAgent) * 100}%` : "0%" }}
                  />
                </div>
                <span className="w-5 text-end text-xs text-gray-500 font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feedback Card ────────────────────────────────────────────────────────────

function FeedbackCard({
  item,
  isAdmin,
  onUpvote,
  onReply,
  onStatusChange,
}: {
  item: FeedbackItem;
  isAdmin: boolean;
  onUpvote: (id: string) => void;
  onReply: (id: string, reply: string) => void;
  onStatusChange: (id: string, status: Status) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState(item.adminReply ?? "");
  const [editingReply, setEditingReply] = useState(false);

  const cat = CATEGORY_META[item.category];
  const statusMeta = STATUS_META[item.status];
  const prioMeta = PRIORITY_META[item.priority];

  function submitReply() {
    onReply(item.id, replyText);
    setEditingReply(false);
  }

  return (
    <div
      className={`bg-white rounded-xl border transition-shadow ${
        item.status === "open" || item.status === "in-review"
          ? "border-gray-200 hover:shadow-sm"
          : "border-gray-100 opacity-80"
      }`}
    >
      {/* Header row */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Priority dot */}
        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${prioMeta.dot}`} title={prioMeta.label} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>
              {cat.icon} {cat.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-gray-900 leading-snug">{item.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {item.agentName} · {item.submittedAt}
          </p>
        </div>

        {/* Upvote */}
        <button
          onClick={(e) => { e.stopPropagation(); onUpvote(item.id); }}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg border transition-colors shrink-0 ${
            item.upvotedByMe
              ? "bg-indigo-50 border-indigo-300 text-indigo-600"
              : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600"
          }`}
        >
          <span className="text-xs">▲</span>
          <span className="text-xs font-bold">{item.upvotes}</span>
        </button>

        <span className="text-gray-400 text-sm mt-1">{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-700 leading-relaxed">{item.body}</p>

          {/* Admin reply */}
          {item.adminReply && !editingReply && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-indigo-700">תגובת מנהל</span>
                <span className="text-xs text-indigo-400">{item.adminRepliedAt}</span>
              </div>
              <p className="text-sm text-indigo-800">{item.adminReply}</p>
              {isAdmin && (
                <button
                  onClick={() => setEditingReply(true)}
                  className="text-xs text-indigo-500 hover:text-indigo-700 mt-1"
                >
                  ערוך תגובה
                </button>
              )}
            </div>
          )}

          {/* Admin reply editor */}
          {isAdmin && (editingReply || !item.adminReply) && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">
                {item.adminReply ? "ערוך תגובה" : "הוסף תגובה"}
              </label>
              <textarea
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 resize-none min-h-[80px]"
                placeholder="כתוב תגובה לנציג…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={submitReply}
                  disabled={!replyText.trim()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  שמור תגובה
                </button>
                {editingReply && (
                  <button
                    onClick={() => { setEditingReply(false); setReplyText(item.adminReply ?? ""); }}
                    className="px-4 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50"
                  >
                    ביטול
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Admin status controls */}
          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-gray-500 me-1">שנה סטטוס:</span>
              {(["open", "in-review", "resolved", "declined"] as Status[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(item.id, s)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                    item.status === s
                      ? STATUS_META[s].color + " border-transparent"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── New Feedback Modal ───────────────────────────────────────────────────────

function NewFeedbackModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (f: Partial<FeedbackItem>) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<Category>("suggestion");
  const [priority, setPriority] = useState<Priority>("medium");

  function submit() {
    if (!title.trim() || !body.trim()) return;
    onSubmit({ title: title.trim(), body: body.trim(), category, priority });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">פנייה חדשה</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">קטגוריה</label>
            <select
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {Object.entries(CATEGORY_META).map(([k, m]) => (
                <option key={k} value={k}>{m.icon} {m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">עדיפות</label>
            <select
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {Object.entries(PRIORITY_META).map(([k, m]) => (
                <option key={k} value={k}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">כותרת *</label>
          <input
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            placeholder="תאר בקצרה את הבעיה או ההצעה…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">פירוט *</label>
          <textarea
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 resize-none min-h-[100px]"
            placeholder="תאר בפירוט — מה קרה, מתי, ואיך זה השפיע על העבודה?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50"
          >
            ביטול
          </button>
          <button
            onClick={submit}
            disabled={!title.trim() || !body.trim()}
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            שלח פנייה
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("board");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const isAdmin = true; // toggle to false for agent view

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback");
      if (!res.ok) throw new Error("Failed to fetch feedback");
      const data = await res.json();
      setItems((data.items as ApiItem[]).map(mapApiItem));
    } catch (err) {
      console.error("Error fetching feedback:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Derived
  const filtered = items.filter((i) => {
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    if (filterCategory !== "all" && i.category !== filterCategory) return false;
    if (filterPriority !== "all" && i.priority !== filterPriority) return false;
    if (search && !i.title.includes(search) && !i.body.includes(search) && !i.agentName.includes(search)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => b.upvotes - a.upvotes);

  async function handleUpvote(id: string) {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, upvotes: i.upvotedByMe ? i.upvotes - 1 : i.upvotes + 1, upvotedByMe: !i.upvotedByMe }
          : i
      )
    );
    try {
      const res = await fetch(`/api/feedback/${id}/upvote`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle upvote");
    } catch (err) {
      console.error("Error toggling upvote:", err);
      // Revert on failure
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, upvotes: i.upvotedByMe ? i.upvotes - 1 : i.upvotes + 1, upvotedByMe: !i.upvotedByMe }
            : i
        )
      );
    }
  }

  async function handleReply(id: string, reply: string) {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, adminReply: reply, adminRepliedAt: "עכשיו", status: i.status === "open" ? "in-review" : i.status }
          : i
      )
    );
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: reply }),
      });
      if (!res.ok) throw new Error("Failed to save reply");
    } catch (err) {
      console.error("Error saving reply:", err);
      fetchItems(); // Re-fetch to restore correct state
    }
  }

  async function handleStatusChange(id: string, status: Status) {
    const prevItems = items;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch (err) {
      console.error("Error updating status:", err);
      setItems(prevItems); // Revert on failure
    }
  }

  async function handleNewFeedback(f: Partial<FeedbackItem>) {
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: f.title,
          body: f.body,
          category: f.category,
          priority: f.priority,
        }),
      });
      if (!res.ok) throw new Error("Failed to create feedback");
      const data = await res.json();
      setItems((prev) => [mapApiItem(data), ...prev]);
    } catch (err) {
      console.error("Error creating feedback:", err);
    }
  }

  const openCount = items.filter((i) => i.status === "open").length;
  const reviewCount = items.filter((i) => i.status === "in-review").length;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">לוח משוב נציגים</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {openCount} פתוחות · {reviewCount} בבדיקה · {items.length} סה״כ
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(["board", "stats"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    view === v ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {v === "board" ? "📋 לוח" : "📊 סטטיסטיקות"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 flex items-center gap-1.5"
            >
              + פנייה חדשה
            </button>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
            <span className="mr-3 text-sm text-gray-500">טוען פניות...</span>
          </div>
        ) : view === "stats" ? (
          <StatsView items={items} />
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <input
                className="flex-1 min-w-[180px] text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                placeholder="חיפוש…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as Status | "all")}
              >
                <option value="all">כל הסטטוסים</option>
                {Object.entries(STATUS_META).map(([k, m]) => (
                  <option key={k} value={k}>{m.label}</option>
                ))}
              </select>

              <select
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as Category | "all")}
              >
                <option value="all">כל הקטגוריות</option>
                {Object.entries(CATEGORY_META).map(([k, m]) => (
                  <option key={k} value={k}>{m.icon} {m.label}</option>
                ))}
              </select>

              <select
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as Priority | "all")}
              >
                <option value="all">כל העדיפויות</option>
                {Object.entries(PRIORITY_META).map(([k, m]) => (
                  <option key={k} value={k}>{m.label}</option>
                ))}
              </select>

              {(filterStatus !== "all" || filterCategory !== "all" || filterPriority !== "all" || search) && (
                <button
                  onClick={() => { setFilterStatus("all"); setFilterCategory("all"); setFilterPriority("all"); setSearch(""); }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  נקה סינון ×
                </button>
              )}
            </div>

            {/* Count */}
            <p className="text-xs text-gray-400">{sorted.length} פניות</p>

            {/* Cards */}
            {sorted.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm">לא נמצאו פניות תואמות לסינון</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sorted.map((item) => (
                  <FeedbackCard
                    key={item.id}
                    item={item}
                    isAdmin={isAdmin}
                    onUpvote={handleUpvote}
                    onReply={handleReply}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showModal && (
        <NewFeedbackModal onClose={() => setShowModal(false)} onSubmit={handleNewFeedback} />
      )}
    </div>
  );
}
