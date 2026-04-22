// src/app/api/fields/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeStatus } from "@/lib/status";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const field = await db.field.findUnique({
      where: { id: params.id },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        updates: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { name: true, role: true } } },
        },
      },
    });

    if (!field) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Agents can only view their own fields
    if (session.user.role === "AGENT" && field.agentId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ ...field, status: computeStatus(field) });
  } catch (error) {
    console.error("[FIELD_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const field = await db.field.findUnique({ where: { id: params.id } });
    if (!field) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Agents can only update their own fields
    if (session.user.role === "AGENT" && field.agentId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, cropType, plantingDate, location, areaAcres, agentId } = body;

    // Agents cannot reassign fields
    const updateData: any = {};
    if (name) updateData.name = name;
    if (cropType) updateData.cropType = cropType;
    if (plantingDate) updateData.plantingDate = new Date(plantingDate);
    if (location !== undefined) updateData.location = location;
    if (areaAcres !== undefined) updateData.areaAcres = parseFloat(areaAcres);
    if (agentId !== undefined && session.user.role === "ADMIN") {
      updateData.agentId = agentId || null;
    }

    const updated = await db.field.update({
      where: { id: params.id },
      data: updateData,
      include: {
        agent: { select: { id: true, name: true, email: true } },
        updates: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { author: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json({ ...updated, status: computeStatus(updated) });
  } catch (error) {
    console.error("[FIELD_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.field.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FIELD_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
