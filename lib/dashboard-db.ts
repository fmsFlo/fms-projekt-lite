import { prisma } from "@/lib/prisma";

/**
 * Execute raw SELECT queries with parameters using Prisma.
 * Replaces old SQLite dbAll(), dbGet(), dbRun() functionality.
 */

// Convert '?', '?', '?' placeholders to $1, $2, $3...
function convertPlaceholders(query: string): string {
  let idx = 0;
  return query.replace(/\?/g, () => `$${++idx}`);
}

export async function dbAll(query: string, params: any[] = []) {
  const sql = convertPlaceholders(query);
  return prisma.$queryRawUnsafe(sql, ...params);
}

export async function dbGet(query: string, params: any[] = []) {
  const sql = convertPlaceholders(query);
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return rows[0] || null;
}

export async function dbRun(query: string, params: any[] = []) {
  const sql = convertPlaceholders(query);
  await prisma.$executeRawUnsafe(sql, ...params);

  // Prisma does not expose lastID / changes like SQLite
  return { lastID: 0, changes: 1 };
}


