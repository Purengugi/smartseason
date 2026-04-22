// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeStatus } from "@/lib/status";
import { Stage } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = session.user.role === "ADMIN";
    const where = isAdmin ? {} : { agentId: session.user.id };

    const fields = await db.field.findMany({
      where,
      include: {
        updates: { orderBy: { createdAt: "desc" }, take: 5, include: { author: { select: { name: true } } } },
        agent: { select: { id: true, name: true } },
      },
    });

    const statuses = fields.map((f: any) => computeStatus(f));

    const stats = {
      total: fields.length,
      active: statuses.filter((s: any) => s === "ACTIVE").length,
      atRisk: statuses.filter((s: any) => s === "AT_RISK").length,
      completed: statuses.filter((s: any) => s === "COMPLETED").length,
      stageBreakdown: {
        planted: fields.filter((f: any) => f.stage === Stage.PLANTED).length,
        growing: fields.filter((f: any) => f.stage === Stage.GROWING).length,
        ready: fields.filter((f: any) => f.stage === Stage.READY).length,
        harvested: fields.filter((f: any) => f.stage === Stage.HARVESTED).length,
      },
    };

    // Recent activity (last 5 updates across all fields)
    const recentUpdates = await db.fieldUpdate.findMany({
      where: isAdmin ? {} : { field: { agentId: session.user.id } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        field: { select: { id: true, name: true } },
        author: { select: { name: true } },
      },
    });

    // Admin only: agent summary
    let agentSummary = null;
    if (isAdmin) {
      const agents = await db.user.findMany({
        where: { role: "AGENT" },
        select: {
          id: true,
          name: true,
          _count: { select: { fields: true } },
        },
      });
      agentSummary = agents;
    }

    return NextResponse.json({ stats, recentUpdates, agentSummary });
  } catch (error) {
    console.error("[DASHBOARD_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
