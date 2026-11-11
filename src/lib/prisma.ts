import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL não está configurada.");
}

/**
 * O driver `pg` já trata `sslmode=require|prefer|verify-ca` como `verify-full`
 * e emite um aviso de depreciação. Explicitamos `verify-full` (mesmo
 * comportamento, validação completa do certificado) para silenciar o aviso.
 */
function normalizeSslMode(url: string) {
  try {
    const parsed = new URL(url);
    const mode = parsed.searchParams.get("sslmode");
    if (mode && ["require", "prefer", "verify-ca"].includes(mode) && !parsed.searchParams.has("uselibpqcompat")) {
      parsed.searchParams.set("sslmode", "verify-full");
      return parsed.toString();
    }
  } catch {
    // URL fora do formato padrão: usa como está.
  }
  return url;
}

const adapter = new PrismaPg({ connectionString: normalizeSslMode(databaseUrl) });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
