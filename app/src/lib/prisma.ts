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

  // A single admin page routinely fires several queries in parallel
  // (Promise.all). A pool of 1 forces every one of those onto the same
  // connection, serialising work that should overlap. Default to 3 to
  // match a typical pgbouncer connection_limit rather than defeating
  // in-request parallelism; raise DATABASE_POOL_MAX explicitly if your
  // pooler allows more.
  return process.env.NODE_ENV === "production" ? 3 : 5;
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
