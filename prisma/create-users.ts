import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Agent user
  const agentHash = await bcrypt.hash("Agent123!", 10);
  const agent = await prisma.user.upsert({
    where: { email: "agent@servando.co.il" },
    update: { passwordHash: agentHash },
    create: {
      email: "agent@servando.co.il",
      passwordHash: agentHash,
      name: "נציגה ראשית",
      role: "AGENT",
      agentStatus: "ONLINE",
      locale: "he",
    },
  });
  console.log("Agent:", agent.email, agent.role);

  // Find business
  const biz = await prisma.business.findFirst({ where: { name: { contains: "כהן" } } });
  if (!biz) {
    console.error("Business not found!");
    process.exit(1);
  }

  // Client user
  const clientHash = await bcrypt.hash("Client123!", 10);
  const client = await prisma.user.upsert({
    where: { email: "client@servando.co.il" },
    update: { passwordHash: clientHash, businessId: biz.id },
    create: {
      email: "client@servando.co.il",
      passwordHash: clientHash,
      name: "ד״ר יוסי כהן",
      role: "CLIENT",
      businessId: biz.id,
      locale: "he",
    },
  });
  console.log("Client:", client.email, client.role, "businessId:", client.businessId);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
