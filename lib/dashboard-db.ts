import { prisma } from "@/lib/prisma";

/**
 * Execute raw SELECT queries with parameters using Prisma.
 * Replaces old SQLite dbAll(), dbGet(), dbRun() functionality.
 */

// Convert '?', '?', '?' placeholders to $1, $2, $3...
// Behandelt auch '?::timestamp' korrekt
function convertPlaceholders(query: string): string {
  let idx = 0;
  // Ersetze ?::timestamp zuerst, dann normale ?
  return query
    .replace(/\?::timestamp/g, () => `$${++idx}::timestamp`)
    .replace(/\?/g, () => `$${++idx}`);
}

export async function dbAll(query: string, params: any[] = []) {
  try {
    const sql = convertPlaceholders(query);
    return await prisma.$queryRawUnsafe(sql, ...params);
  } catch (error: any) {
    // Bei Connection-Fehler: Versuche Reconnect
    if (error.message?.includes('Closed') || error.message?.includes('connection')) {
      console.warn('[dbAll] Connection-Fehler, versuche Reconnect...');
      try {
        await prisma.$disconnect();
        await prisma.$connect();
        const sql = convertPlaceholders(query);
        return await prisma.$queryRawUnsafe(sql, ...params);
      } catch (retryError: any) {
        console.error('[dbAll] Reconnect fehlgeschlagen:', retryError.message);
        throw retryError;
      }
    }
    throw error;
  }
}

export async function dbGet(query: string, params: any[] = []) {
  try {
    const sql = convertPlaceholders(query);
    const rows = await prisma.$queryRawUnsafe(sql, ...params);
    return rows[0] || null;
  } catch (error: any) {
    // Bei Connection-Fehler: Versuche Reconnect
    if (error.message?.includes('Closed') || error.message?.includes('connection')) {
      console.warn('[dbGet] Connection-Fehler, versuche Reconnect...');
      try {
        await prisma.$disconnect();
        await prisma.$connect();
        const sql = convertPlaceholders(query);
        const rows = await prisma.$queryRawUnsafe(sql, ...params);
        return rows[0] || null;
      } catch (retryError: any) {
        console.error('[dbGet] Reconnect fehlgeschlagen:', retryError.message);
        throw retryError;
      }
    }
    throw error;
  }
}

export async function dbRun(query: string, params: any[] = []) {
  try {
    const sql = convertPlaceholders(query);
    await prisma.$executeRawUnsafe(sql, ...params);
    return { lastID: 0, changes: 1 };
  } catch (error: any) {
    // Bei Connection-Fehler: Versuche Reconnect
    if (error.message?.includes('Closed') || error.message?.includes('connection')) {
      console.warn('[dbRun] Connection-Fehler, versuche Reconnect...');
      try {
        await prisma.$disconnect();
        await prisma.$connect();
        const sql = convertPlaceholders(query);
        await prisma.$executeRawUnsafe(sql, ...params);
        return { lastID: 0, changes: 1 };
      } catch (retryError: any) {
        console.error('[dbRun] Reconnect fehlgeschlagen:', retryError.message);
        throw retryError;
      }
    }
    throw error;
  }
}


