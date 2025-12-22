export const runtime = "nodejs";       // Vercel cannot run DB on Edge
export const dynamic = "force-dynamic";
export const revalidate = 0

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { dbAll } from "@/lib/dashboard-db";

export async function GET(req: NextRequest) {
  try {
    // Session check
    const session = req.cookies.get("session")?.value;
    if (!session || !session.includes(":")) {
      return NextResponse.json(
        { message: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const [role] = session.split(":");
    if (role !== "admin") {
      return NextResponse.json(
        { message: "Nur Administratoren können Dashboards anzeigen" },
        { status: 403 }
      );
    }

    // Query params
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const userId = url.searchParams.get("userId");
    const limitParam = url.searchParams.get("limit");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const limit = limitParam ? parseInt(limitParam) : null;

    // Build WHERE clause
    let where = "WHERE 1=1";
    const params: any[] = [];

    if (startDate) {
      where += " AND ce.\"startTime\" >= ?";
      params.push(startDate);
    }

    if (endDate) {
      where += " AND ce.\"startTime\" <= ?";
      params.push(endDate);
    }

    if (userId) {
      where += " AND ce.\"userId\" = ?";
      params.push(userId);
    }

    // Base query - Prisma verwendet PascalCase für Spaltennamen, aber Frontend erwartet snake_case
    // Daher müssen wir Aliase verwenden
    let query = `
      SELECT 
        ce.id,
        ce."createdAt" as created_at,
        ce."updatedAt" as updated_at,
        ce."calendlyEventUri" as calendly_event_uri,
        ce."eventTypeName" as event_type_name,
        ce."mappedType" as mapped_type,
        ce."startTime" as start_time,
        ce."endTime" as end_time,
        ce.status,
        COALESCE(u.name, ce."hostName") AS host_name,
        ce."hostEmail" as host_email,
        ce."userId" as user_id,
        ce."inviteeName" as invitee_name,
        ce."inviteeEmail" as invitee_email,
        ce."leadId" as lead_id,
        ce."syncedAt" as synced_at
      FROM calendly_events ce
      LEFT JOIN "User" u ON ce."userId" = u.id
      ${where}
      ORDER BY ce."startTime" ASC
    `;

    // Apply LIMIT + OFFSET only if limit is provided
    if (limit !== null) {
      query += " LIMIT ? OFFSET ?";
      params.push(limit, offset);
    }

    // Execute
    const results = await dbAll(query, params);
    console.log(`[Calendly Events API] Query: ${query.substring(0, 100)}...`);
    console.log(`[Calendly Events API] Params:`, params);
    console.log(`[Calendly Events API] Results count:`, results?.length || 0);
    if (results && results.length > 0) {
      console.log(`[Calendly Events API] First result:`, JSON.stringify(results[0], null, 2));
    }
    return NextResponse.json(results);

  } catch (err: any) {
    console.error("Fehler bei /api/dashboard/calendly/events:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



