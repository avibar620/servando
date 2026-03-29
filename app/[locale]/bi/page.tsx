"use client";

import { useState, useEffect, createContext, useContext } from "react";
import LogoutButton from "@/components/LogoutButton";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "operations" | "agents" | "clients" | "revenue" | "content" | "sla";

interface MetricCard {
  label: string;
  value: string;
  delta: string;
  deltaDir: "up" | "down";
  positive: boolean; // up is good?
}

// ─── BI Data Context ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BiContext = createContext<Record<string, any>>({});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useBi(): Record<string, any> { return useContext(BiContext); }

// ─── Mock Data (fallback) ─────────────────────────────────────────────────────

const HOURS = ["00", "02", "04", "06", "08", "10", "12", "14", "16", "18", "20", "22"];
const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

// Heatmap: calls volume by day × hour (0-10 scale)
const heatmapData: number[][] = [
  [0, 0, 0, 0, 1, 3, 7, 9, 8, 6, 4, 2],
  [0, 0, 0, 0, 1, 4, 8, 10, 9, 7, 5, 2],
  [0, 0, 0, 0, 2, 5, 9, 10, 8, 6, 4, 1],
  [0, 0, 0, 0, 1, 3, 7, 9, 7, 5, 3, 1],
  [0, 0, 0, 0, 2, 5, 8, 9, 7, 5, 3, 1],
  [0, 0, 0, 0, 0, 1, 3, 5, 4, 3, 1, 0],
  [0, 0, 0, 0, 0, 0, 1, 2, 2, 1, 0, 0],
];

const reasonCodes = [
  { label: "בירור לגבי שירות קיים", count: 142, pct: 31 },
  { label: "תיאום תור / פגישה", count: 98, pct: 21 },
  { label: "תלונה / בקשת פנייה", count: 74, pct: 16 },
  { label: "שאלה כללית", count: 61, pct: 13 },
  { label: "בקשת מחיר / הצעה", count: 48, pct: 10 },
  { label: "אחר", count: 42, pct: 9 },
];

const mrrData = [
  { month: "אוק׳", mrr: 12400 },
  { month: "נוב׳", mrr: 13100 },
  { month: "דצמ׳", mrr: 13800 },
  { month: "ינו׳", mrr: 14200 },
  { month: "פבר׳", mrr: 15600 },
  { month: "מרץ", mrr: 16100 },
];

const agentRows = [
  { name: "מיכל כהן", calls: 312, handled: 289, avgDur: "3:42", satisfaction: 4.7, status: "online" },
  { name: "דני לוי", calls: 278, handled: 251, avgDur: "4:11", satisfaction: 4.5, status: "online" },
  { name: "רנה פרץ", calls: 256, handled: 241, avgDur: "3:28", satisfaction: 4.8, status: "offline" },
  { name: "אבי שמיר", calls: 198, handled: 176, avgDur: "4:52", satisfaction: 4.2, status: "break" },
  { name: "נועה ברק", calls: 167, handled: 159, avgDur: "3:15", satisfaction: 4.9, status: "online" },
];

const clientRows = [
  { name: "מרפאת ד״ר כהן", calls: 88, tickets: 14, minutes: 320, churn: 0.02 },
  { name: "גראז׳ מוטי", calls: 64, tickets: 9, minutes: 210, churn: 0 },
  { name: "עו״ד רוזנברג", calls: 57, tickets: 7, minutes: 190, churn: 0.05 },
  { name: "חנות ספרים שירה", calls: 43, tickets: 5, minutes: 140, churn: 0 },
  { name: "פלאפל גיא", calls: 38, tickets: 4, minutes: 110, churn: 0 },
];

const slaBreaches = [
  { business: "מרפאת ד״ר כהן", threshold: 10, breaches: 3, avgCallback: "8:14", compliance: 91 },
  { business: "עו״ד רוזנברג", threshold: 15, breaches: 1, avgCallback: "12:07", compliance: 97 },
  { business: "גראז׳ מוטי", threshold: 30, breaches: 0, avgCallback: "6:32", compliance: 100 },
  { business: "חנות ספרים שירה", threshold: 30, breaches: 2, avgCallback: "18:45", compliance: 94 },
];

const topKeywords = [
  { word: "תור", count: 204 },
  { word: "מחיר", count: 156 },
  { word: "שעות פתיחה", count: 143 },
  { word: "בעיה", count: 98 },
  { word: "דחיפות", count: 87 },
  { word: "ביטול", count: 64 },
  { word: "החזר", count: 51 },
  { word: "המלצה", count: 48 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function heatColor(v: number): string {
  if (v === 0) return "bg-gray-100";
  if (v <= 2) return "bg-indigo-100";
  if (v <= 4) return "bg-indigo-200";
  if (v <= 6) return "bg-indigo-400";
  if (v <= 8) return "bg-indigo-600";
  return "bg-indigo-800";
}

const MRR_MAX = 20000;
function mrrBarH(val: number): number {
  return Math.round((val / MRR_MAX) * 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ label, value, delta, deltaDir, positive }: MetricCard) {
  const isGood = deltaDir === "up" ? positive : !positive;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className={`text-xs mt-1 font-medium ${isGood ? "text-emerald-600" : "text-red-500"}`}>
        {deltaDir === "up" ? "▲" : "▼"} {delta} vs. חודש קודם
      </p>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: "bg-emerald-500",
    offline: "bg-gray-400",
    break: "bg-amber-400",
  };
  const labels: Record<string, string> = { online: "פעיל", offline: "לא מחובר", break: "הפסקה" };
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className={`w-2 h-2 rounded-full ${colors[status] ?? "bg-gray-400"}`} />
      {labels[status] ?? status}
    </span>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function OperationsTab() {
  const bi = useBi();
  const opsData = bi.operations;
  // Use API heatmap if available, otherwise fallback to mock
  const heat = opsData?.heatmap ?? heatmapData;
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="שיחות החודש" value="465" delta="8%" deltaDir="up" positive={true} />
        <Card label="שיחות טופלו" value="438" delta="6%" deltaDir="up" positive={true} />
        <Card label="זמן ממוצע לשיחה" value="3:51" delta="0:12" deltaDir="down" positive={true} />
        <Card label="פניות פתוחות" value="27" delta="4" deltaDir="down" positive={true} />
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">מפת חום — עומס שיחות לפי יום ושעה</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="text-end text-gray-400 font-normal w-16 pe-2" />
                {HOURS.map((h) => (
                  <th key={h} className="text-center text-gray-400 font-normal w-10">{h}:00</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, di) => (
                <tr key={day}>
                  <td className="text-end text-gray-600 font-medium pe-2 whitespace-nowrap">{day}</td>
                  {(heat[di] ?? []).map((val: number, hi: number) => (
                    <td key={hi} className="p-0">
                      <div
                        className={`w-10 h-8 rounded ${heatColor(val)} flex items-center justify-center`}
                        title={`${day} ${HOURS[hi]}:00 — ${val * 5} שיחות`}
                      >
                        {val > 0 && (
                          <span className={`text-[10px] font-semibold ${val >= 7 ? "text-white" : "text-gray-700"}`}>
                            {val * 5}
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
          <span>נמוך</span>
          {["bg-indigo-100", "bg-indigo-200", "bg-indigo-400", "bg-indigo-600", "bg-indigo-800"].map((c) => (
            <span key={c} className={`w-5 h-4 rounded ${c} inline-block`} />
          ))}
          <span>גבוה</span>
        </div>
      </div>

      {/* Call volume bar chart (mock) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">שיחות יומיות — 30 יום אחרונים</h3>
        <div className="flex items-end gap-1 h-24">
          {Array.from({ length: 30 }, (_, i) => {
            const v = 5 + Math.round(Math.sin(i * 0.6) * 6 + Math.random() * 8);
            return (
              <div
                key={i}
                className="flex-1 bg-indigo-500 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                style={{ height: `${(v / 25) * 100}%` }}
                title={`יום ${i + 1}: ${v} שיחות`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AgentsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="נציגים פעילים" value="4" delta="1" deltaDir="up" positive={true} />
        <Card label="ממוצע שיחות/נציג" value="242" delta="18" deltaDir="up" positive={true} />
        <Card label="שביעות רצון ממוצעת" value="4.6" delta="0.2" deltaDir="up" positive={true} />
        <Card label="אחוז טיפול" value="93.4%" delta="1.2%" deltaDir="up" positive={true} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">ביצועי נציגים — חודש נוכחי</h3>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-start">נציג</th>
              <th className="px-4 py-3 text-center">סטטוס</th>
              <th className="px-4 py-3 text-center">שיחות</th>
              <th className="px-4 py-3 text-center">טופלו</th>
              <th className="px-4 py-3 text-center">ממוצע זמן</th>
              <th className="px-4 py-3 text-center">שביעות רצון</th>
              <th className="px-4 py-3 text-center">% טיפול</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agentRows.map((a) => {
              const pct = Math.round((a.handled / a.calls) * 100);
              return (
                <tr key={a.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                  <td className="px-4 py-3 text-center"><StatusDot status={a.status} /></td>
                  <td className="px-4 py-3 text-center">{a.calls}</td>
                  <td className="px-4 py-3 text-center">{a.handled}</td>
                  <td className="px-4 py-3 text-center font-mono">{a.avgDur}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-amber-400">★</span>
                      <span className="font-medium">{a.satisfaction}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${pct >= 95 ? "bg-emerald-500" : pct >= 85 ? "bg-amber-400" : "bg-red-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs w-8 text-end text-gray-600">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Satisfaction distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">התפלגות שביעות רצון</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const counts: Record<number, number> = { 5: 38, 4: 29, 3: 11, 2: 4, 1: 2 };
            const total = 84;
            const pct = Math.round((counts[star] / total) * 100);
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-gray-600 flex items-center gap-1">
                  <span className="text-amber-400">{"★".repeat(star)}</span>
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div className="h-3 rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-10 text-end text-gray-500 text-xs">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ClientsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="לקוחות פעילים" value="23" delta="2" deltaDir="up" positive={true} />
        <Card label="לקוחות חדשים החודש" value="3" delta="1" deltaDir="up" positive={true} />
        <Card label="סיומי חוזה" value="1" delta="0" deltaDir="down" positive={false} />
        <Card label="NPS ממוצע" value="72" delta="5" deltaDir="up" positive={true} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">טבלת לקוחות</h3>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-start">עסק</th>
              <th className="px-4 py-3 text-center">שיחות</th>
              <th className="px-4 py-3 text-center">כרטיסים</th>
              <th className="px-4 py-3 text-center">דקות נוצלו</th>
              <th className="px-4 py-3 text-center">סיכון נטישה</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clientRows.map((c) => (
              <tr key={c.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-center">{c.calls}</td>
                <td className="px-4 py-3 text-center">{c.tickets}</td>
                <td className="px-4 py-3 text-center">{c.minutes}</td>
                <td className="px-4 py-3 text-center">
                  {c.churn === 0 ? (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">נמוך</span>
                  ) : c.churn <= 0.03 ? (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">בינוני</span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">גבוה</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Minutes usage donut (CSS-only approximation) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">ניצול דקות לפי תוכנית</h3>
        <div className="flex gap-6 flex-wrap">
          {[
            { plan: "Starter", used: 65, total: 100, color: "bg-indigo-400" },
            { plan: "Growth", used: 140, total: 200, color: "bg-violet-500" },
            { plan: "Scale", used: 310, total: 500, color: "bg-emerald-500" },
          ].map((p) => {
            const pct = Math.round((p.used / p.total) * 100);
            return (
              <div key={p.plan} className="flex-1 min-w-[140px]">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{p.plan}</span>
                  <span>{p.used}/{p.total} דקות</span>
                </div>
                <div className="bg-gray-100 rounded-full h-3">
                  <div className={`h-3 rounded-full ${p.color}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-end">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RevenueTab() {
  const maxMrr = Math.max(...mrrData.map((m) => m.mrr));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="MRR" value="₪16,100" delta="3.2%" deltaDir="up" positive={true} />
        <Card label="ARR משוחזר" value="₪193,200" delta="3.2%" deltaDir="up" positive={true} />
        <Card label="הכנסה ממינויים" value="₪13,400" delta="5%" deltaDir="up" positive={true} />
        <Card label="הכנסה מדקות נוספות" value="₪2,700" delta="12%" deltaDir="up" positive={true} />
      </div>

      {/* MRR trend bar chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-5">מגמת MRR — 6 חודשים</h3>
        <div className="flex items-end gap-6 h-40">
          {mrrData.map((m) => {
            const pct = Math.round((m.mrr / maxMrr) * 100);
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-indigo-700">₪{(m.mrr / 1000).toFixed(1)}k</span>
                <div className="w-full flex items-end" style={{ height: "100px" }}>
                  <div
                    className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors cursor-default"
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">פילוח הכנסות לפי תוכנית</h3>
          <div className="space-y-3">
            {[
              { label: "Scale (₪899/חודש)", count: 8, revenue: 7192, color: "bg-emerald-500" },
              { label: "Growth (₪499/חודש)", count: 10, revenue: 4990, color: "bg-violet-500" },
              { label: "Starter (₪249/חודש)", count: 5, revenue: 1245, color: "bg-indigo-400" },
            ].map((p) => {
              const pct = Math.round((p.revenue / 13427) * 100);
              return (
                <div key={p.label}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{p.label} × {p.count}</span>
                    <span className="font-semibold">₪{p.revenue.toLocaleString()}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${p.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">הכנסות נוספות</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: "דקות נוספות", amount: "₪2,700", pct: 55 },
              { label: "דמי הקמה", amount: "₪600", pct: 12 },
              { label: "שירות לקוחות פרימיום", amount: "₪400", pct: 8 },
              { label: "אחר", amount: "₪300", pct: 6 },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="w-40 text-gray-600">{r.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-amber-400" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="w-16 text-end font-medium text-gray-800">{r.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="שיחות מנותחות" value="438" delta="6%" deltaDir="up" positive={true} />
        <Card label="נושאים ייחודיים" value="6" delta="1" deltaDir="up" positive={true} />
        <Card label="מילים ממוצע לשיחה" value="184" delta="12" deltaDir="up" positive={false} />
        <Card label="סנטימנט חיובי" value="71%" delta="4%" deltaDir="up" positive={true} />
      </div>

      {/* Reason codes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">קודי סיבה — פילוח פניות</h3>
        <div className="space-y-3">
          {reasonCodes.map((r) => (
            <div key={r.label} className="flex items-center gap-3">
              <span className="w-52 text-sm text-gray-700 shrink-0">{r.label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 relative">
                <div
                  className="h-4 rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${r.pct}%` }}
                />
                <span className="absolute inset-0 flex items-center ps-2 text-xs text-white font-medium">
                  {r.pct > 10 ? `${r.count} (${r.pct}%)` : ""}
                </span>
              </div>
              {r.pct <= 10 && (
                <span className="text-xs text-gray-500 w-16 text-end">{r.count} ({r.pct}%)</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Keywords cloud (list-based) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">מילות מפתח נפוצות</h3>
        <div className="flex flex-wrap gap-2">
          {topKeywords.map((k) => {
            const size = k.count > 150 ? "text-2xl" : k.count > 100 ? "text-xl" : k.count > 80 ? "text-base" : "text-sm";
            const opacity = k.count > 150 ? "opacity-100" : k.count > 100 ? "opacity-80" : "opacity-60";
            return (
              <span
                key={k.word}
                className={`${size} ${opacity} font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg cursor-default`}
                title={`${k.count} הופעות`}
              >
                {k.word}
              </span>
            );
          })}
        </div>
      </div>

      {/* Sentiment trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">מגמת סנטימנט — 30 יום</h3>
        <div className="flex items-end gap-0.5 h-20">
          {Array.from({ length: 30 }, (_, i) => {
            const pos = 60 + Math.round(Math.sin(i * 0.4) * 15 + Math.random() * 10);
            return (
              <div key={i} className="flex-1 flex flex-col gap-0 h-full">
                <div className="flex-1 bg-red-200 rounded-t-sm" style={{ flex: 100 - pos }} />
                <div className="bg-emerald-400" style={{ flex: pos }} />
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> חיובי</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-200 inline-block" /> שלילי</span>
        </div>
      </div>
    </div>
  );
}

function SlaTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="עמידה ב-SLA" value="94.8%" delta="1.2%" deltaDir="up" positive={true} />
        <Card label="הפרות SLA" value="6" delta="2" deltaDir="down" positive={true} />
        <Card label="ממוצע זמן התקשרות חזרה" value="9:14" delta="0:43" deltaDir="down" positive={true} />
        <Card label="שיחות שהחמצנו" value="27" delta="3" deltaDir="down" positive={true} />
      </div>

      {/* SLA by business */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">עמידה ב-SLA לפי עסק</h3>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-start">עסק</th>
              <th className="px-4 py-3 text-center">סף SLA</th>
              <th className="px-4 py-3 text-center">הפרות</th>
              <th className="px-4 py-3 text-center">ממוצע התקשרות</th>
              <th className="px-4 py-3 text-start">עמידה</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {slaBreaches.map((s) => (
              <tr key={s.business} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{s.business}</td>
                <td className="px-4 py-3 text-center">{s.threshold} דקות</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${s.breaches > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {s.breaches}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-mono">{s.avgCallback}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${s.compliance >= 98 ? "bg-emerald-500" : s.compliance >= 90 ? "bg-amber-400" : "bg-red-500"}`}
                        style={{ width: `${s.compliance}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${s.compliance >= 98 ? "text-emerald-600" : s.compliance >= 90 ? "text-amber-600" : "text-red-600"}`}>
                      {s.compliance}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SLA breach timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">ציר זמן הפרות SLA</h3>
        <div className="space-y-3">
          {[
            { time: "היום 09:32", business: "מרפאת ד״ר כהן", waited: "14 דקות", threshold: 10, agent: "מיכל כהן" },
            { time: "אתמול 16:17", business: "מרפאת ד״ר כהן", waited: "11 דקות", threshold: 10, agent: "דני לוי" },
            { time: "אתמול 13:05", business: "עו״ד רוזנברג", waited: "18 דקות", threshold: 15, agent: "אבי שמיר" },
            { time: "22/03 11:40", business: "חנות ספרים שירה", waited: "34 דקות", threshold: 30, agent: "נועה ברק" },
          ].map((e, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
              <div className="flex-1 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-red-700 font-semibold">{e.business}</span>
                  <span className="text-xs text-gray-500">{e.time}</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  המתנה: <strong>{e.waited}</strong> (סף: {e.threshold} דקות) · נציג: {e.agent}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SLA compliance trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">מגמת עמידה ב-SLA — שבועות</h3>
        <div className="flex items-end gap-3 h-24">
          {[
            { w: "שבוע 1", pct: 89 },
            { w: "שבוע 2", pct: 91 },
            { w: "שבוע 3", pct: 93 },
            { w: "שבוע 4", pct: 95 },
            { w: "שבוע 5", pct: 94 },
            { w: "שבוע 6", pct: 95 },
          ].map((w) => (
            <div key={w.w} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-semibold text-gray-700">{w.pct}%</span>
              <div className="w-full" style={{ height: "60px", display: "flex", alignItems: "flex-end" }}>
                <div
                  className={`w-full rounded-t ${w.pct >= 95 ? "bg-emerald-500" : w.pct >= 90 ? "bg-amber-400" : "bg-red-500"}`}
                  style={{ height: `${w.pct - 80}%`, minHeight: "8px" }}
                />
              </div>
              <span className="text-xs text-gray-500">{w.w}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-400 text-center">יעד SLA: 95%</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: "operations", label: "תפעול" },
  { id: "agents", label: "נציגות" },
  { id: "clients", label: "לקוחות" },
  { id: "revenue", label: "הכנסות" },
  { id: "content", label: "תוכן שיחות" },
  { id: "sla", label: "SLA" },
];

export default function BiPage() {
  const [activeTab, setActiveTab] = useState<TabId>("operations");
  const [range, setRange] = useState<"week" | "month" | "quarter">("month");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [biData, setBiData] = useState<Record<string, any>>({});

  useEffect(() => {
    async function fetchTab() {
      try {
        const res = await fetch(`/api/bi?tab=${activeTab}`);
        if (res.ok) {
          const data = await res.json();
          setBiData((prev) => ({ ...prev, [activeTab]: data }));
        }
      } catch {
        // keep mock data
      }
    }
    fetchTab();
  }, [activeTab]);

  return (
    <BiContext.Provider value={biData}>
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">לוח בקרה BI</h1>
            <p className="text-xs text-gray-500 mt-0.5">נתונים עדכניים · עודכן לאחרונה: היום 10:14</p>
          </div>
          <div className="flex items-center gap-2">
            {(["week", "month", "quarter"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  range === r
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {r === "week" ? "שבוע" : r === "month" ? "חודש" : "רבעון"}
              </button>
            ))}
            <button className="ms-2 px-3 py-1.5 rounded-lg text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
              <span>⬇</span> ייצוא
            </button>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-0 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "operations" && <OperationsTab />}
        {activeTab === "agents" && <AgentsTab />}
        {activeTab === "clients" && <ClientsTab />}
        {activeTab === "revenue" && <RevenueTab />}
        {activeTab === "content" && <ContentTab />}
        {activeTab === "sla" && <SlaTab />}
      </main>
    </div>
    </BiContext.Provider>
  );
}
