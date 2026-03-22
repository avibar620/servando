"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

interface BusinessDetails {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  website: string;
  description: string;
}

interface ServicesInfo {
  openingHours: string;
  closedDays: string[];
  services: string[];
  faq: { q: string; a: string }[];
  transferNumber: string;
  urgentKeywords: string;
  customGreeting: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  minutes: number;
  features: string[];
  recommended?: boolean;
}

interface PaymentInfo {
  cardHolder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "רפואה ובריאות",
  "משפטים ורואי חשבון",
  "מסעדות ומזון",
  "קמעונאות",
  "שירותי תיקון ואינסטלציה",
  "יופי וספא",
  "חינוך",
  "נדל\"ן",
  "אחר",
];

const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 249,
    minutes: 100,
    features: [
      "100 דקות / חודש",
      "1 מספר טלפון",
      "תמלול שיחות",
      "סיכום AI בסיסי",
      "לוח בקרה לקוח",
      "תמיכה במייל",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 499,
    minutes: 200,
    recommended: true,
    features: [
      "200 דקות / חודש",
      "2 מספרי טלפון",
      "תמלול + תרגום",
      "סיכום AI מלא",
      "כרטיסי פניות",
      "SLA מותאם אישית",
      "תמיכה בצ'אט",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    price: 899,
    minutes: 500,
    features: [
      "500 דקות / חודש",
      "מספרים בלתי מוגבלים",
      "תמלול + תרגום + AI",
      "API גישה",
      "דוחות BI מלאים",
      "מנהל חשבון ייעודי",
      "SLA 99.9%",
      "תמיכה 24/7",
    ],
  },
];

// ─── Step components ──────────────────────────────────────────────────────────

function StepBusinessDetails({
  data,
  onChange,
}: {
  data: BusinessDetails;
  onChange: (d: BusinessDetails) => void;
}) {
  function set(field: keyof BusinessDetails, value: string) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">פרטי העסק</h2>
        <p className="text-sm text-gray-500">המידע ישמש את הנציגים שלנו לזיהוי וייצוג העסק שלך.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="שם העסק *" required>
          <input
            className="input"
            placeholder="למשל: מרפאת ד״ר כהן"
            value={data.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="שם איש קשר *" required>
          <input
            className="input"
            placeholder="שם פרטי ומשפחה"
            value={data.contactName}
            onChange={(e) => set("contactName", e.target.value)}
          />
        </Field>
        <Field label="אימייל *" required>
          <input
            className="input"
            type="email"
            placeholder="email@example.com"
            value={data.email}
            onChange={(e) => set("email", e.target.value)}
            dir="ltr"
          />
        </Field>
        <Field label="טלפון *" required>
          <input
            className="input"
            type="tel"
            placeholder="050-0000000"
            value={data.phone}
            onChange={(e) => set("phone", e.target.value)}
            dir="ltr"
          />
        </Field>
        <Field label="כתובת העסק">
          <input
            className="input"
            placeholder="רחוב, עיר"
            value={data.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </Field>
        <Field label="קטגוריית עסק *" required>
          <select
            className="input"
            value={data.category}
            onChange={(e) => set("category", e.target.value)}
          >
            <option value="">בחר קטגוריה…</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="אתר אינטרנט">
          <input
            className="input"
            type="url"
            placeholder="https://..."
            value={data.website}
            onChange={(e) => set("website", e.target.value)}
            dir="ltr"
          />
        </Field>
      </div>

      <Field label="תיאור קצר של העסק">
        <textarea
          className="input min-h-[90px] resize-none"
          placeholder="מה העסק שלך עושה? מה חשוב שהנציג ידע?"
          value={data.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>
    </div>
  );
}

function StepServicesInfo({
  data,
  onChange,
}: {
  data: ServicesInfo;
  onChange: (d: ServicesInfo) => void;
}) {
  const [newService, setNewService] = useState("");
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");

  function toggleDay(day: string) {
    const next = data.closedDays.includes(day)
      ? data.closedDays.filter((d) => d !== day)
      : [...data.closedDays, day];
    onChange({ ...data, closedDays: next });
  }

  function addService() {
    if (!newService.trim()) return;
    onChange({ ...data, services: [...data.services, newService.trim()] });
    setNewService("");
  }

  function removeService(i: number) {
    onChange({ ...data, services: data.services.filter((_, idx) => idx !== i) });
  }

  function addFaq() {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    onChange({ ...data, faq: [...data.faq, { q: newFaqQ.trim(), a: newFaqA.trim() }] });
    setNewFaqQ("");
    setNewFaqA("");
  }

  function removeFaq(i: number) {
    onChange({ ...data, faq: data.faq.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">שירותים ומידע</h2>
        <p className="text-sm text-gray-500">מידע זה יעזור לנציגים לענות על שאלות נפוצות בצורה מדויקת.</p>
      </div>

      {/* Opening hours */}
      <Field label="שעות פעילות">
        <input
          className="input"
          placeholder="למשל: א׳–ה׳ 09:00–18:00, שישי 09:00–13:00"
          value={data.openingHours}
          onChange={(e) => onChange({ ...data, openingHours: e.target.value })}
        />
      </Field>

      {/* Closed days */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ימי סגירה</label>
        <div className="flex flex-wrap gap-2">
          {DAYS_HE.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                data.closedDays.includes(day)
                  ? "bg-red-100 border-red-300 text-red-700"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Services list */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">שירותים / מוצרים עיקריים</label>
        <div className="flex gap-2 mb-2">
          <input
            className="input flex-1"
            placeholder="הוסף שירות…"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addService())}
          />
          <button
            type="button"
            onClick={addService}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            הוסף
          </button>
        </div>
        {data.services.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.services.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full"
              >
                {s}
                <button
                  onClick={() => removeService(i)}
                  className="text-indigo-400 hover:text-indigo-700 ms-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Transfer number */}
      <Field label="מספר להעברת שיחות דחופות">
        <input
          className="input"
          type="tel"
          placeholder="050-0000000"
          value={data.transferNumber}
          onChange={(e) => onChange({ ...data, transferNumber: e.target.value })}
          dir="ltr"
        />
      </Field>

      {/* Urgent keywords */}
      <Field label='מילות מפתח לדחיפות (מופרדות ב-",")'>
        <input
          className="input"
          placeholder="אמבולנס, חירום, דחוף מאד"
          value={data.urgentKeywords}
          onChange={(e) => onChange({ ...data, urgentKeywords: e.target.value })}
        />
      </Field>

      {/* Custom greeting */}
      <Field label="פתיח מותאם אישית">
        <textarea
          className="input min-h-[80px] resize-none"
          placeholder='למשל: "שלום, הגעת למרפאת ד״ר כהן. כיצד אוכל לעזור לך?"'
          value={data.customGreeting}
          onChange={(e) => onChange({ ...data, customGreeting: e.target.value })}
        />
      </Field>

      {/* FAQ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">שאלות ותשובות נפוצות</label>
        {data.faq.map((item, i) => (
          <div key={i} className="flex gap-2 mb-2 items-start">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-800">ש: {item.q}</p>
              <p className="text-gray-600 mt-0.5">ת: {item.a}</p>
            </div>
            <button
              onClick={() => removeFaq(i)}
              className="text-gray-400 hover:text-red-500 mt-3 text-lg"
            >
              ×
            </button>
          </div>
        ))}
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 space-y-2">
          <input
            className="input bg-white"
            placeholder="שאלה…"
            value={newFaqQ}
            onChange={(e) => setNewFaqQ(e.target.value)}
          />
          <input
            className="input bg-white"
            placeholder="תשובה…"
            value={newFaqA}
            onChange={(e) => setNewFaqA(e.target.value)}
          />
          <button
            type="button"
            onClick={addFaq}
            className="px-4 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300"
          >
            + הוסף שאלה
          </button>
        </div>
      </div>
    </div>
  );
}

function StepPlanSelection({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">בחירת תוכנית</h2>
        <p className="text-sm text-gray-500">ניתן לשדרג או לשנות תוכנית בכל עת מלוח הבקרה.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => onChange(plan.id)}
            className={`relative text-start rounded-2xl border-2 p-5 transition-all ${
              selected === plan.id
                ? "border-indigo-600 bg-indigo-50 shadow-md"
                : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm"
            }`}
          >
            {plan.recommended && (
              <span className="absolute -top-3 start-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                מומלץ
              </span>
            )}
            <div className="mb-3">
              <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-indigo-700">₪{plan.price}</span>
                <span className="text-sm text-gray-500">/חודש</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{plan.minutes} דקות כלולות</p>
            </div>
            <ul className="space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-emerald-500 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            {selected === plan.id && (
              <div className="absolute top-3 end-3 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>💡 טיפ:</strong> תוכנית Growth מתאימה לרוב העסקים הקטנים-בינוניים. ניתן לרכוש דקות נוספות במחיר ₪2.50/דקה בכל עת.
      </div>
    </div>
  );
}

function StepPayment({
  data,
  onChange,
  plan,
}: {
  data: PaymentInfo;
  onChange: (d: PaymentInfo) => void;
  plan: Plan | undefined;
}) {
  function set(field: keyof PaymentInfo, value: string) {
    onChange({ ...data, [field]: value });
  }

  function formatCard(v: string) {
    return v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  }

  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">פרטי תשלום</h2>
        <p className="text-sm text-gray-500">חיוב מאובטח עם הצפנת SSL. ניתן לבטל בכל עת.</p>
      </div>

      {/* Order summary */}
      {plan && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-indigo-800 mb-2">סיכום הזמנה</h3>
          <div className="flex justify-between text-sm text-indigo-700">
            <span>תוכנית {plan.name} · {plan.minutes} דקות/חודש</span>
            <span className="font-bold">₪{plan.price}/חודש</span>
          </div>
          <div className="border-t border-indigo-200 mt-2 pt-2 flex justify-between text-sm font-bold text-indigo-900">
            <span>סה״כ לחיוב היום</span>
            <span>₪{plan.price}</span>
          </div>
        </div>
      )}

      {/* Card form */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-700">פרטי כרטיס אשראי</h3>
          <div className="flex gap-1.5 text-xs text-gray-400" dir="ltr">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">VISA</span>
            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">MC</span>
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">AMEX</span>
          </div>
        </div>

        <Field label="שם בעל הכרטיס">
          <input
            className="input"
            placeholder="כפי שמופיע על הכרטיס"
            value={data.cardHolder}
            onChange={(e) => set("cardHolder", e.target.value)}
          />
        </Field>

        <Field label="מספר כרטיס">
          <input
            className="input font-mono tracking-widest"
            placeholder="0000 0000 0000 0000"
            value={data.cardNumber}
            onChange={(e) => set("cardNumber", formatCard(e.target.value))}
            maxLength={19}
            dir="ltr"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="תוקף">
            <input
              className="input font-mono"
              placeholder="MM/YY"
              value={data.expiry}
              onChange={(e) => set("expiry", formatExpiry(e.target.value))}
              maxLength={5}
              dir="ltr"
            />
          </Field>
          <Field label="CVV">
            <input
              className="input font-mono"
              placeholder="000"
              value={data.cvv}
              onChange={(e) => set("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              dir="ltr"
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>🔒</span>
        <span>התשלום מאובטח ומוצפן. פרטי הכרטיס לא נשמרים על השרתים שלנו — מעובד על ידי Stripe.</span>
      </div>
    </div>
  );
}

function StepCompletion({ businessName }: { businessName: string }) {
  return (
    <div className="flex flex-col items-center text-center py-8 space-y-6">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <span className="text-4xl">✓</span>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ברוכים הבאים לסרוונדו! 🎉</h2>
        <p className="text-gray-600 max-w-md">
          {businessName ? `${businessName} ` : "העסק שלך "}הוגדר בהצלחה. הנציגים שלנו כבר מוכנים לקבל שיחות עבורך.
        </p>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 text-start w-full max-w-md space-y-3">
        <h3 className="text-sm font-semibold text-indigo-800">מה קורה עכשיו?</h3>
        <ol className="space-y-2 text-sm text-indigo-700">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
            <span>שלחנו לך אימייל עם פרטי הגישה ללוח הבקרה שלך.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
            <span>בתוך 24 שעות תקבל מספר טלפון ייחודי לעסק שלך.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
            <span>מנהל החשבון שלך ייצור איתך קשר להדרכה ראשונית.</span>
          </li>
        </ol>
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <a
          href="/portal"
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
        >
          עבור ללוח הבקרה
        </a>
        <button
          className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          onClick={() => window.print()}
        >
          הדפס אישור
        </button>
      </div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ms-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressStepper({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: "פרטי העסק" },
    { n: 2, label: "שירותים" },
    { n: 3, label: "תוכנית" },
    { n: 4, label: "תשלום" },
    { n: 5, label: "סיום" },
  ];

  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                s.n < current
                  ? "bg-emerald-500 text-white"
                  : s.n === current
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s.n < current ? "✓" : s.n}
            </div>
            <span
              className={`text-xs mt-1 whitespace-nowrap ${
                s.n === current ? "text-indigo-600 font-semibold" : "text-gray-400"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-12 md:w-20 h-0.5 mb-4 mx-1 transition-colors ${
                s.n < current ? "bg-emerald-400" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Token validation ─────────────────────────────────────────────────────────

function InvalidToken() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">קישור לא תקין</h1>
        <p className="text-sm text-gray-500">
          הקישור שבו השתמשת אינו תקין או שפג תוקפו. אנא פנה לצוות סרוונדו לקבלת קישור חדש.
        </p>
        <a
          href="mailto:support@servando.co.il"
          className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
        >
          support@servando.co.il
        </a>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const params = useParams();
  const token = Array.isArray(params.token) ? params.token[0] : (params.token ?? "");

  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    category: "",
    website: "",
    description: "",
  });

  const [servicesInfo, setServicesInfo] = useState<ServicesInfo>({
    openingHours: "",
    closedDays: ["שבת"],
    services: [],
    faq: [],
    transferNumber: "",
    urgentKeywords: "",
    customGreeting: "",
  });

  const [selectedPlan, setSelectedPlan] = useState("growth");

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    cardHolder: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  // Simulate token validation
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    const timer = setTimeout(() => {
      // In production: validate against backend
      setTokenValid(token.length >= 8);
    }, 600);
    return () => clearTimeout(timer);
  }, [token]);

  function canProceed(): boolean {
    if (step === 1) {
      return !!(
        businessDetails.name.trim() &&
        businessDetails.contactName.trim() &&
        businessDetails.email.trim() &&
        businessDetails.phone.trim() &&
        businessDetails.category
      );
    }
    if (step === 3) return !!selectedPlan;
    if (step === 4) {
      return !!(
        paymentInfo.cardHolder.trim() &&
        paymentInfo.cardNumber.replace(/\s/g, "").length === 16 &&
        paymentInfo.expiry.length === 5 &&
        paymentInfo.cvv.length >= 3
      );
    }
    return true;
  }

  async function handleNext() {
    if (step === 4) {
      setSaving(true);
      // Simulate payment + account creation
      await new Promise((r) => setTimeout(r, 1800));
      setSaving(false);
    }
    setStep((s) => Math.min(5, s + 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">מאמת קישור…</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) return <InvalidToken />;

  const plan = PLANS.find((p) => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="text-xl font-extrabold text-indigo-700 tracking-tight">Servando</div>
          {step < 5 && (
            <span className="text-xs text-gray-400">שלב {step} מתוך 4</span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Stepper */}
        {step < 5 && <ProgressStepper current={step} />}

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
          {step === 1 && (
            <StepBusinessDetails data={businessDetails} onChange={setBusinessDetails} />
          )}
          {step === 2 && (
            <StepServicesInfo data={servicesInfo} onChange={setServicesInfo} />
          )}
          {step === 3 && (
            <StepPlanSelection selected={selectedPlan} onChange={setSelectedPlan} />
          )}
          {step === 4 && (
            <StepPayment data={paymentInfo} onChange={setPaymentInfo} plan={plan} />
          )}
          {step === 5 && (
            <StepCompletion businessName={businessDetails.name} />
          )}
        </div>

        {/* Navigation */}
        {step < 5 && (
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
              className={`px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors ${
                step === 1 ? "invisible" : ""
              }`}
            >
              ← חזרה
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || saving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  מעבד תשלום…
                </>
              ) : step === 4 ? (
                "אשר ושלם →"
              ) : (
                "המשך →"
              )}
            </button>
          </div>
        )}
      </main>

      {/* Global input styles via style tag */}
      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #111827;
          background: white;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
        select.input {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
