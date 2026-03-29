import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Safe seeding (upsert only)...");
  const hash = await bcrypt.hash("123456", 10);

  // ─── Plans ──────────────────────────────────────────────────────
  const starter = await prisma.plan.upsert({
    where: { slug: "STARTER" },
    update: {},
    create: { slug: "STARTER", name: "Starter", priceNis: 249, minutes: 100, features: ["100 דקות / חודש", "1 מספר טלפון", "תמלול שיחות"], sortOrder: 1 },
  });
  const growth = await prisma.plan.upsert({
    where: { slug: "GROWTH" },
    update: {},
    create: { slug: "GROWTH", name: "Growth", priceNis: 499, minutes: 200, features: ["200 דקות / חודש", "2 מספרי טלפון", "סיכום AI מלא"], sortOrder: 2 },
  });
  const scale = await prisma.plan.upsert({
    where: { slug: "SCALE" },
    update: {},
    create: { slug: "SCALE", name: "Scale", priceNis: 899, minutes: 500, features: ["500 דקות / חודש", "מספרים בלתי מוגבלים", "API גישה"], sortOrder: 3 },
  });
  console.log("  Plans: OK");

  // ─── Admin user ─────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@servando.co.il" },
    update: {},
    create: { email: "admin@servando.co.il", passwordHash: hash, name: "אבי בר-אור", role: "ADMIN", locale: "he" },
  });
  console.log("  Admin: OK");

  // ─── Business: מרפאת ד״ר כהן ───────────────────────────────────
  let biz = await prisma.business.findFirst({ where: { name: "מרפאת ד״ר כהן" } });
  if (!biz) {
    biz = await prisma.business.create({
      data: {
        name: "מרפאת ד״ר כהן", ownerName: "ד״ר יוסי כהן", phone: "03-6441234", email: "clinic@drkohn.co.il",
        category: "רפואה ובריאות", status: "ACTIVE", planId: scale.id,
        minutesTotal: 250, minutesUsed: 78, slaThresholdMin: 10,
        openingHours: "א׳–ה׳ 08:00–19:00, שישי 08:00–13:00", closedDays: ["שבת"],
        greetingScript: "שלום, הגעת למרפאת ד״ר כהן. כיצד אוכל לעזור?",
      },
    });
    console.log("  Business created: מרפאת ד״ר כהן");
  } else {
    console.log("  Business exists: מרפאת ד״ר כהן");
  }

  // ─── Agent: שירה לוי ────────────────────────────────────────────
  const agent = await prisma.user.upsert({
    where: { email: "shira@servando.co.il" },
    update: {},
    create: { email: "shira@servando.co.il", passwordHash: hash, name: "שירה לוי", role: "AGENT", agentStatus: "ONLINE", locale: "he" },
  });
  console.log("  Agent: שירה לוי OK");

  // ─── Client user for the business ──────────────────────────────
  await prisma.user.upsert({
    where: { email: "clinic@drkohn.co.il" },
    update: {},
    create: { email: "clinic@drkohn.co.il", passwordHash: hash, name: "ד״ר יוסי כהן", role: "CLIENT", businessId: biz.id, locale: "he" },
  });
  console.log("  Client user: OK");

  // ─── Counters (upsert) ─────────────────────────────────────────
  for (const c of [
    { id: "ticket_referred", value: 2260 },
    { id: "ticket_internal", value: 2555 },
    { id: "call", value: 900 },
    { id: "transaction", value: 3050 },
  ]) {
    await prisma.counter.upsert({ where: { id: c.id }, update: {}, create: c });
  }
  console.log("  Counters: OK");

  // ─── 5 Tickets (skip if already have tickets for this business) ─
  const existingTickets = await prisma.ticket.count({ where: { businessId: biz.id } });
  if (existingTickets < 5) {
    const ticketsToCreate = [
      { displayId: "#2256", type: "REFERRED" as const, caseType: "LEAD" as const, subject: "בקשת הצעת מחיר — ביטוח שיניים", status: "IN_PROGRESS" as const, priority: "HIGH" as const, callerName: "רחל גולדשטיין", callerPhone: "054-7612345", aiSummary: "מתעניינת בביטוח שיניים מקיף למשפחה." },
      { displayId: "K2549", type: "INTERNAL" as const, caseType: "SCHEDULE" as const, subject: "תיאום תור — ביקורת שנתית", status: "OPEN" as const, priority: "NORMAL" as const, callerName: "אברהם כהן", callerPhone: "052-8889999", aiSummary: "לקוח מבקש ביקורת שנתית." },
      { displayId: "#2257", type: "REFERRED" as const, caseType: "OWNER_MSG" as const, subject: "תלונה — זמני המתנה ארוכים", status: "OPEN" as const, priority: "URGENT" as const, callerName: "דינה שמעוני", callerPhone: "050-1112233", ownerMessage: "דינה התקשרה בכעס — המתינה 40 דקות." },
      { displayId: "K2550", type: "INTERNAL" as const, caseType: "GENERAL" as const, subject: "שאלה על שעות פתיחה", status: "CLOSED" as const, priority: "LOW" as const, callerName: "משה ישראלי", callerPhone: "058-7776655", notes: "עניתי ללקוח — א׳-ה׳ 08:00-19:00", closedAt: new Date("2026-03-22") },
      { displayId: "#2258", type: "REFERRED" as const, caseType: "LEAD" as const, subject: "בקשת מידע על טיפולי שיניים", status: "OPEN" as const, priority: "NORMAL" as const, callerName: "יעל דוד", callerPhone: "053-4445566", aiSummary: "לקוחה חדשה, מתעניינת בטיפולי שיניים." },
    ];

    for (const t of ticketsToCreate) {
      const exists = await prisma.ticket.findUnique({ where: { displayId: t.displayId } });
      if (!exists) {
        await prisma.ticket.create({
          data: { ...t, businessId: biz.id, agentId: agent.id },
        });
      }
    }
    console.log("  Tickets: created/verified 5");
  } else {
    console.log("  Tickets: already have", existingTickets);
  }

  // ─── 3 Calls (skip if already have calls) ──────────────────────
  const existingCalls = await prisma.call.count({ where: { businessId: biz.id } });
  if (existingCalls < 3) {
    const callsToCreate = [
      { displayId: "C-0891", callerPhone: "054-7612345", routing: "SERVANDO" as const, startedAt: new Date("2026-03-23T09:14:00"), endedAt: new Date("2026-03-23T09:18:22"), durationSec: 262 },
      { displayId: "C-0892", callerPhone: "052-8889999", routing: "SERVANDO" as const, startedAt: new Date("2026-03-23T10:02:00"), endedAt: new Date("2026-03-23T10:05:48"), durationSec: 228 },
      { displayId: "C-0893", callerPhone: "058-7776655", routing: "SERVANDO" as const, startedAt: new Date("2026-03-22T14:30:00"), endedAt: new Date("2026-03-22T14:32:15"), durationSec: 135 },
    ];

    for (const c of callsToCreate) {
      const exists = await prisma.call.findUnique({ where: { displayId: c.displayId } });
      if (!exists) {
        await prisma.call.create({
          data: { ...c, businessId: biz.id, agentId: agent.id },
        });
      }
    }
    console.log("  Calls: created/verified 3");
  } else {
    console.log("  Calls: already have", existingCalls);
  }

  // ─── 2 Missed Calls (skip if already have) ─────────────────────
  const existingMissed = await prisma.missedCall.count({ where: { businessId: biz.id } });
  if (existingMissed < 2) {
    await prisma.missedCall.createMany({
      data: [
        { phone: "050-4443322", businessId: biz.id, receivedAt: new Date("2026-03-23T09:32:00"), status: "waiting" },
        { phone: "054-9998877", businessId: biz.id, receivedAt: new Date("2026-03-23T08:15:00"), status: "handled", assignedToId: agent.id, handledAt: new Date("2026-03-23T08:22:00") },
      ],
      skipDuplicates: true,
    });
    console.log("  Missed calls: created 2");
  } else {
    console.log("  Missed calls: already have", existingMissed);
  }

  // ─── Transactions ──────────────────────────────────────────────
  const existingTxn = await prisma.transaction.count({ where: { businessId: biz.id } });
  if (existingTxn < 1) {
    await prisma.transaction.createMany({
      data: [
        { displayId: "TXN-3041", businessId: biz.id, description: "מנוי Scale — מרץ 2026", amountNis: 899, status: "PAID", paidAt: new Date("2026-03-01") },
        { displayId: "TXN-3042", businessId: biz.id, description: "דקות נוספות — 50 דקות", amountNis: 125, status: "PAID", paidAt: new Date("2026-03-15") },
      ],
      skipDuplicates: true,
    });
    console.log("  Transactions: created");
  } else {
    console.log("  Transactions: already have", existingTxn);
  }

  console.log("Safe seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
