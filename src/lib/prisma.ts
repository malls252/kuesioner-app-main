import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/src/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPool?: Pool;
};

let prismaInstance: PrismaClient;

const getPrisma = (): PrismaClient => {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  if (prismaInstance) {
    return prismaInstance;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL belum diset.");
  }

  const pool = globalForPrisma.prismaPool ?? new Pool({ connectionString });
  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
    globalForPrisma.prismaPool = pool;
  } else {
    prismaInstance = prisma;
  }

  return prisma;
};

// Export prisma as a Proxy that redirects all calls to the lazily initialized client
const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const client = getPrisma();
    return Reflect.get(client, prop, receiver);
  },
});

export { prisma };
