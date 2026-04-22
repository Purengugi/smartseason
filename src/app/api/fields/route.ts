// src/app/api/fields/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeStatus } from "@/lib/status";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const where =
      session.user.role === "AGENT" ? { agentId: session.user.id } : {};

    const fields = await db.field.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true, email: true } },
        updates: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { author: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const fieldsWithStatus = fields.map((f: any) => ({
      ...f,
      status: computeStatus(f),
    }));

    return NextResponse.json(fieldsWithStatus);
  } catch (error) {
    console.error("[FIELDS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, cropType, plantingDate, location, areaAcres, agentId } = body;

    if (!name || !cropType || !plantingDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const field = await db.field.create({
      data: {
        name,
        cropType,
        plantingDate: new Date(plantingDate),
        location: location || null,
        areaAcres: areaAcres ? parseFloat(areaAcres) : null,
        agentId: agentId || null,
      },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        updates: true,
      },
    });

    return NextResponse.json({ ...field, status: computeStatus(field) }, { status: 201 });
  } catch (error) {
    console.error("[FIELDS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
