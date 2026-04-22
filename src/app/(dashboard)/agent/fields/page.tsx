// src/app/(dashboard)/agent/fields/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { computeStatus } from "@/lib/status";
import { FieldCard } from "@/components/FieldCard";

export const dynamic = "force-dynamic";

export default async function AgentFieldsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENT") redirect("/login");

  const fields = await db.field.findMany({
    where: { agentId: session.user.id },
    include: {
      agent: { select: { id: true, name: true, email: true } },
      updates: { orderBy: { createdAt: "desc" }, take: 10 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const fieldsWithStatus = fields.map((f: any) => ({ ...f, status: computeStatus(f) }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">My Fields</h1>
        <p className="text-sm text-gray-500 mt-1">{fields.length} field{fields.length !== 1 ? "s" : ""} assigned to you</p>
      </div>

      {fieldsWithStatus.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-gray-500 font-medium">No fields assigned yet</p>
          <p className="text-sm text-gray-400 mt-1">Contact your coordinator to get fields assigned.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {fieldsWithStatus.map((f: any) => (
            <FieldCard key={f.id} field={f as any} basePath="/agent" />
          ))}
        </div>
      )}
    </div>
  );
}
