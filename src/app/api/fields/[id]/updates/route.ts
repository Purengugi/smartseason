// src/app/api/fields/[id]/updates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Stage } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const field = await db.field.findUnique({ where: { id: params.id } });
    if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });

    // Agents can only update their own assigned fields
    if (session.user.role === "AGENT" && field.agentId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { stage, notes } = body;

    if (!stage || !Object.values(Stage).includes(stage)) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }

    // Create update record and advance the field stage
    const [update] = await db.$transaction([
      db.fieldUpdate.create({
        data: {
          fieldId: params.id,
          stage: stage as Stage,
          notes: notes || null,
          authorId: session.user.id,
        },
        include: { author: { select: { name: true } } },
      }),
      db.field.update({
        where: { id: params.id },
        data: { stage: stage as Stage },
      }),
    ]);

    return NextResponse.json(update, { status: 201 });
  } catch (error) {
    console.error("[FIELD_UPDATE_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
