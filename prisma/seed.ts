import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // ─── Plans ──────────────────────────────────────────────────────
  const starter = await prisma.plan.upsert({
    where: { slug: "STARTER" },
    update: {},
    create: { slug: "STARTER", name: "Starter", priceNis: 249, minutes: 100, features: ["100 דקות / חודש", "1 מספר טלפון", "תמלול שיחות", "סיכום AI בסיסי", "לוח בקרה לקוח", "תמיכה במייל"], sortOrder: 1 },
  });
  const growth = await prisma.plan.upsert({
    where: { slug: "GROWTH" },
    update: {},
    create: { slug: "GROWTH", name: "Growth", priceNis: 499, minutes: 200, features: ["200 דקות / חודש", "2 מספרי טלפון", "תמלול + תרגום", "סיכום AI מלא", "כרטיסי פניות", "SLA מותאם אישית", "תמיכה בצ'אט"], sortOrder: 2 },
  });
  const scale = await prisma.plan.upsert({
    where: { slug: "SCALE" },
    update: {},
    create: { slug: "SCALE", name: "Scale", priceNis: 899, minutes: 500, features: ["500 דקות / חודש", "מספרים בלתי מוגבלים", "תמלול + תרגום + AI", "API גישה", "דוחות BI מלאים", "מנהל חשבון ייעודי", "SLA 99.9%", "תמיכה 24/7"], sortOrder: 3 },
  });

  const hash = await bcrypt.hash("123456", 10);

  // ─── Admin user ─────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@servando.co.il" },
    update: {},
    create: { email: "admin@servando.co.il", passwordHash: hash, name: "אבי בר-אור", role: "ADMIN", locale: "he" },
  });

  // ─── Businesses ─────────────────────────────────────────────────
  const biz1 = await prisma.business.create({
    data: {
      name: "מרפאת ד״ר כהן", ownerName: "ד״ר יוסי כהן", phone: "03-6441234", email: "clinic@drkohn.co.il",
      category: "רפואה ובריאות", status: "ACTIVE", planId: scale.id,
      minutesTotal: 500, minutesUsed: 320, slaThresholdMin: 10,
      openingHours: "א׳–ה׳ 08:00–19:00, שישי 08:00–13:00", closedDays: ["שבת"],
      greetingScript: "שלום, הגעת למרפאת ד״ר כהן. כיצד אוכל לעזור?",
    },
  });
  const biz2 = await prisma.business.create({
    data: {
      name: "גראז׳ מוטי", ownerName: "מוטי לוי", phone: "04-8321567", email: "moti@garage.co.il",
      category: "שירותי תיקון ואינסטלציה", status: "ACTIVE", planId: growth.id,
      minutesTotal: 200, minutesUsed: 140, slaThresholdMin: 30,
      openingHours: "א׳–ה׳ 07:30–18:00", closedDays: ["שבת", "שישי"],
    },
  });
  const biz3 = await prisma.business.create({
    data: {
      name: "עו״ד רוזנברג", ownerName: "שרה רוזנברג", phone: "02-5677890", email: "sarah@rozenberg-law.co.il",
      category: "משפטים ורואי חשבון", status: "ACTIVE", planId: growth.id,
      minutesTotal: 200, minutesUsed: 45, slaThresholdMin: 15,
    },
  });
  const biz4 = await prisma.business.create({
    data: {
      name: "חנות ספרים שירה", ownerName: "שירה אבני", phone: "09-7712345", email: "shira@books.co.il",
      category: "קמעונאות", status: "ACTIVE", planId: starter.id,
      minutesTotal: 100, minutesUsed: 65, slaThresholdMin: 30,
    },
  });
  const biz5 = await prisma.business.create({
    data: {
      name: "פלאפל גיא", ownerName: "גיא משה", phone: "08-6543210", email: "guy@falafel.co.il",
      category: "מסעדות ומזון", status: "TRIAL", planId: starter.id,
      minutesTotal: 100, minutesUsed: 12,
    },
  });

  // ─── Agent users ────────────────────────────────────────────────
  const agent1 = await prisma.user.create({ data: { email: "michal@servando.co.il", passwordHash: hash, name: "מיכל כהן", role: "AGENT", agentStatus: "ONLINE" } });
  const agent2 = await prisma.user.create({ data: { email: "dani@servando.co.il", passwordHash: hash, name: "דני לוי", role: "AGENT", agentStatus: "ONLINE" } });
  const agent3 = await prisma.user.create({ data: { email: "renee@servando.co.il", passwordHash: hash, name: "רנה פרץ", role: "AGENT", agentStatus: "OFFLINE" } });
  const agent4 = await prisma.user.create({ data: { email: "avi@servando.co.il", passwordHash: hash, name: "אבי שמיר", role: "AGENT", agentStatus: "BUSY" } });
  const agent5 = await prisma.user.create({ data: { email: "noa@servando.co.il", passwordHash: hash, name: "נועה ברק", role: "AGENT", agentStatus: "ONLINE" } });

  // ─── Client users ───────────────────────────────────────────────
  await prisma.user.create({ data: { email: "clinic@drkohn.co.il", passwordHash: hash, name: "ד״ר יוסי כהן", role: "CLIENT", businessId: biz1.id } });
  await prisma.user.create({ data: { email: "moti@garage.co.il", passwordHash: hash, name: "מוטי לוי", role: "CLIENT", businessId: biz2.id } });

  // ─── Counters ───────────────────────────────────────────────────
  await prisma.counter.createMany({
    data: [
      { id: "ticket_referred", value: 2260 },
      { id: "ticket_internal", value: 2555 },
      { id: "call", value: 900 },
      { id: "transaction", value: 3050 },
    ],
    skipDuplicates: true,
  });

  // ─── Tickets ────────────────────────────────────────────────────
  const t1 = await prisma.ticket.create({
    data: {
      displayId: "#2256", type: "REFERRED", caseType: "LEAD", subject: "בקשת הצעת מחיר — ביטוח שיניים",
      status: "IN_PROGRESS", priority: "HIGH", callerName: "רחל גולדשטיין", callerPhone: "054-7612345",
      aiSummary: "מתעניינת בביטוח שיניים מקיף למשפחה. מעוניינת בהשוואה בין 3 מסלולים.", notes: "לקוחה חוזרת, שלחתי מייל עם פרטים",
      businessId: biz1.id, agentId: agent1.id,
    },
  });
  const t2 = await prisma.ticket.create({
    data: {
      displayId: "K2549", type: "INTERNAL", caseType: "SCHEDULE", subject: "תיאום תור — ביקורת שנתית",
      status: "OPEN", priority: "NORMAL", callerName: "אברהם כהן", callerPhone: "052-8889999",
      preferredDate: new Date("2026-03-26"), preferredTime: "10:00", aiSummary: "לקוח מבקש ביקורת שנתית. העדפה לבוקר.",
      businessId: biz1.id, agentId: agent2.id,
    },
  });
  await prisma.ticket.create({
    data: {
      displayId: "#2257", type: "REFERRED", caseType: "OWNER_MSG", subject: "תלונה — זמני המתנה ארוכים",
      status: "OPEN", priority: "URGENT", callerName: "דינה שמעוני", callerPhone: "050-1112233",
      ownerMessage: "דינה התקשרה בכעס — המתינה 40 דקות בטלפון בשבוע שעבר. מבקשת לדבר עם מנהל.",
      businessId: biz3.id, agentId: agent1.id,
    },
  });
  await prisma.ticket.create({
    data: {
      displayId: "K2550", type: "INTERNAL", caseType: "GENERAL", subject: "שאלה על שעות פתיחה",
      status: "CLOSED", priority: "LOW", callerName: "משה ישראלי", callerPhone: "058-7776655",
      notes: "עניתי ללקוח — א׳-ה׳ 08:00-19:00",
      businessId: biz2.id, agentId: agent5.id, closedAt: new Date("2026-03-22"),
    },
  });

  // ─── Tasks for ticket 1 ─────────────────────────────────────────
  await prisma.ticketTask.createMany({
    data: [
      { ticketId: t1.id, text: "לשלוח השוואת מסלולים במייל", status: "DONE", assigneeId: agent1.id },
      { ticketId: t1.id, text: "להתקשר חזרה ביום ד׳", status: "TODO", assigneeId: agent1.id, dueDate: new Date("2026-03-25") },
    ],
  });

  // ─── AI outputs ─────────────────────────────────────────────────
  await prisma.aiOutput.createMany({
    data: [
      { ticketId: t1.id, action: "summary", label: "סיכום שיחה", content: "לקוחה מתעניינת בביטוח שיניים מקיף למשפחה בת 4 נפשות. מעדיפה מסלול עם כיסוי אורתודנטיה לילדים. תקציב עד ₪400/חודש." },
      { ticketId: t1.id, action: "owner-msg", label: "הודעה לבעל עסק", content: "רחל גולדשטיין (054-7612345) מתעניינת בביטוח שיניים משפחתי. בקשה להשוואת 3 מסלולים. ניתן להתקשר אליה עד 18:00." },
      { ticketId: t2.id, action: "summary", label: "סיכום שיחה", content: "אברהם כהן מבקש לקבוע ביקורת שנתית. העדפה ליום ד׳ או ה׳ בבוקר." },
    ],
  });

  // ─── Calls ──────────────────────────────────────────────────────
  await prisma.call.createMany({
    data: [
      { displayId: "C-0891", businessId: biz1.id, agentId: agent1.id, ticketId: t1.id, callerPhone: "054-7612345", routing: "SERVANDO", startedAt: new Date("2026-03-23T09:14:00"), endedAt: new Date("2026-03-23T09:18:22"), durationSec: 262 },
      { displayId: "C-0892", businessId: biz1.id, agentId: agent2.id, ticketId: t2.id, callerPhone: "052-8889999", routing: "SERVANDO", startedAt: new Date("2026-03-23T10:02:00"), endedAt: new Date("2026-03-23T10:05:48"), durationSec: 228 },
      { displayId: "C-0893", businessId: biz2.id, agentId: agent5.id, callerPhone: "058-7776655", routing: "SERVANDO", startedAt: new Date("2026-03-22T14:30:00"), endedAt: new Date("2026-03-22T14:32:15"), durationSec: 135 },
      { displayId: "C-0894", businessId: biz3.id, agentId: agent1.id, callerPhone: "050-1112233", routing: "SERVANDO", startedAt: new Date("2026-03-23T11:20:00"), endedAt: new Date("2026-03-23T11:28:45"), durationSec: 525 },
    ],
  });

  // ─── Missed calls ──────────────────────────────────────────────
  await prisma.missedCall.createMany({
    data: [
      { phone: "050-4443322", businessId: biz1.id, receivedAt: new Date("2026-03-23T09:32:00"), status: "sla-breach" },
      { phone: "054-9998877", businessId: biz1.id, receivedAt: new Date("2026-03-23T08:15:00"), status: "handled", assignedToId: agent2.id, handledAt: new Date("2026-03-23T08:22:00") },
      { phone: "052-1114455", businessId: biz3.id, receivedAt: new Date("2026-03-23T13:05:00"), status: "waiting" },
      { phone: "058-6667788", businessId: biz4.id, receivedAt: new Date("2026-03-22T11:40:00"), status: "handled", assignedToId: agent5.id, handledAt: new Date("2026-03-22T12:14:00") },
    ],
  });

  // ─── Feedback ───────────────────────────────────────────────────
  await prisma.feedback.createMany({
    data: [
      { authorId: agent1.id, category: "BUG", priority: "HIGH", status: "IN_REVIEW", title: "סיכום AI לא מופיע אחרי שיחה קצרה מ-30 שניות", body: "כשהשיחה נמשכת פחות מ-30 שניות, חלון הסיכום נשאר ריק.", adminReply: "מעבירים לצוות הטכני.", adminRepliedAt: new Date(), upvotes: 7 },
      { authorId: agent2.id, category: "SUGGESTION", priority: "MEDIUM", status: "OPEN", title: "הוספת קיצור מקלדת לפתיחת כרטיס חדש", body: "Ctrl+N לפתיחת כרטיס חדש ישירות מחלון השיחה.", upvotes: 12 },
      { authorId: agent5.id, category: "TRAINING", priority: "MEDIUM", status: "RESOLVED", title: "צריך הדרכה על טיפול בלקוחות כועסים", body: "נתקלתי בשיחות קשות ולא ידעתי איך להגיב.", adminReply: "תזמנו סשן הדרכה ל-25/03.", adminRepliedAt: new Date(), upvotes: 5 },
      { authorId: agent4.id, category: "TOOLS", priority: "HIGH", status: "OPEN", title: "כלי החיפוש בהיסטוריית שיחות לאט מאוד", body: "חיפוש לפי שם לקוח לוקח 5-10 שניות.", upvotes: 9 },
    ],
  });

  // ─── Transactions ───────────────────────────────────────────────
  await prisma.transaction.createMany({
    data: [
      { displayId: "TXN-3041", businessId: biz1.id, description: "מנוי Scale — מרץ 2026", amountNis: 899, status: "PAID", paidAt: new Date("2026-03-01") },
      { displayId: "TXN-3042", businessId: biz1.id, description: "דקות נוספות — 50 דקות", amountNis: 125, status: "PAID", paidAt: new Date("2026-03-15") },
      { displayId: "TXN-3043", businessId: biz2.id, description: "מנוי Growth — מרץ 2026", amountNis: 499, status: "PAID", paidAt: new Date("2026-03-01") },
      { displayId: "TXN-3044", businessId: biz3.id, description: "מנוי Growth — מרץ 2026", amountNis: 499, status: "PAID", paidAt: new Date("2026-03-01") },
      { displayId: "TXN-3045", businessId: biz4.id, description: "מנוי Starter — מרץ 2026", amountNis: 249, status: "PAID", paidAt: new Date("2026-03-01") },
    ],
  });

  // ─── Ticket history ─────────────────────────────────────────────
  await prisma.ticketHistory.createMany({
    data: [
      { ticketId: t1.id, actor: agent1.name, action: "create", detail: "כרטיס #2256 נוצר", createdAt: new Date("2026-03-23T09:18:30") },
      { ticketId: t1.id, actor: "AI", action: "ai", detail: "סיכום שיחה נוצר אוטומטית", createdAt: new Date("2026-03-23T09:18:35") },
      { ticketId: t1.id, actor: agent1.name, action: "update", detail: "סטטוס שונה ל-IN_PROGRESS", createdAt: new Date("2026-03-23T09:20:00") },
      { ticketId: t2.id, actor: agent2.name, action: "create", detail: "כרטיס K2549 נוצר", createdAt: new Date("2026-03-23T10:06:00") },
    ],
  });

  console.log("Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
