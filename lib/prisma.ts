import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { _prisma: PrismaClient | undefined };

function getClient(): PrismaClient {
  if (!globalForPrisma._prisma) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    globalForPrisma._prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma._prisma;
}

/** Lazy-initialized Prisma client — only connects on first use */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
