import {Pool} from "pg";
import {PrismaPg} from "@prisma/adapter-pg";
import {PrismaClient} from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPool?: Pool;
};

function readPoolMax() {
  const configured = Number(process.env.DATABASE_POOL_MAX);

  if (Number.isFinite(configured) && configured >= 1) {
    return Math.floor(configured);
  }

  return process.env.NODE_ENV === "production" ? 1 : 3;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const pool =
    globalForPrisma.prismaPool ??
    new Pool({
      connectionString,
      max: readPoolMax(),
      idleTimeoutMillis: 5_000,
      connectionTimeoutMillis: 10_000,
      maxUses: 500,
      ssl: {
        rejectUnauthorized: false,
      },
    });

  globalForPrisma.prismaPool = pool;

  const adapter = new PrismaPg(pool);

  return new PrismaClient({adapter});
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
