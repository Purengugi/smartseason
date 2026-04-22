// src/app/(dashboard)/admin/fields/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { computeStatus, STAGE_ORDER } from "@/lib/status";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { FieldActions } from "./FieldActions";

export const dynamic = "force-dynamic";

export default async function AdminFieldDetail({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

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
  if (!field) notFound();

  const agents = await db.user.findMany({
    where: { role: "AGENT" },
    select: { id: true, name: true },
  });

  const status = computeStatus(field);
  const stageIndex = STAGE_ORDER.indexOf(field.stage);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <div className="mb-5 flex items-center gap-3">
        <Link href="/admin/fields" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="page-title">{field.name}</h1>
        <StatusBadge variant={status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Field info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stage pipeline */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Growth Stage</h2>
            <div className="flex items-center gap-0">
              {STAGE_ORDER.map((stage, i) => {
                const done    = i <  stageIndex;
                const current = i === stageIndex;
                const last    = i === STAGE_ORDER.length - 1;
                return (
                  <div key={stage} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                        ${done    ? "bg-brand-500 text-white"
                        : current ? "bg-brand-600 text-white ring-4 ring-brand-100"
                        :           "bg-gray-100 text-gray-400"}`}>
                        {done ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (i + 1)}
                      </div>
                      <span className={`text-[11px] mt-1 font-medium ${current ? "text-brand-700" : done ? "text-brand-500" : "text-gray-400"}`}>
                        {stage.charAt(0) + stage.slice(1).toLowerCase()}
                      </span>
                    </div>
                    {!last && (
                      <div className={`flex-1 h-0.5 mx-1 mb-5 ${done ? "bg-brand-400" : "bg-gray-100"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Field Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              {[
                { label: "Crop Type",    value: field.cropType },
                { label: "Planted",      value: formatDate(field.plantingDate) },
                { label: "Location",     value: field.location ?? "—" },
                { label: "Area",         value: field.areaAcres ? `${field.areaAcres} acres` : "—" },
                { label: "Agent",        value: field.agent?.name ?? "Unassigned" },
                { label: "Last Updated", value: formatDate(field.updatedAt) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</dt>
                  <dd className="text-sm text-gray-900 font-medium mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Admin actions (client component for interactivity) */}
          <FieldActions field={{ id: field.id, stage: field.stage, agentId: field.agentId }} agents={agents} />
        </div>

        {/* Activity feed */}
        <div className="card p-5 h-fit">
          <h2 className="section-title mb-4">Update History</h2>
          {field.updates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No updates yet</p>
          ) : (
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-100" />
              <div className="space-y-4">
                {field.updates.map((u: any) => (
                  <div key={u.id} className="relative pl-8">
                    <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full border-2 border-brand-400 bg-white" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge variant={u.stage} size="sm" />
                        <span className="text-xs text-gray-400">{u.author.name}</span>
                      </div>
                      {u.notes && (
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{u.notes}</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1">{formatDate(u.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
