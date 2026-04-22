// src/app/(dashboard)/agent/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { computeStatus, STAGE_ORDER } from "@/lib/status";
import { StatsCard } from "@/components/ui/StatsCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FieldCard } from "@/components/FieldCard";
import { formatDate } from "@/lib/utils";

import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AgentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENT") redirect("/login");

  const fields = await db.field.findMany({
    where: { agentId: session.user.id },
    include: {
      agent: { select: { id: true, name: true, email: true } },
      updates: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { author: { select: { name: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const fieldsWithStatus = fields.map((f: any) => ({ ...f, status: computeStatus(f) }));

  const atRiskFields = fieldsWithStatus.filter((f: any) => f.status === "AT_RISK");
  const activeFields = fieldsWithStatus.filter((f: any) => f.status === "ACTIVE");
  const stageBreakdown = STAGE_ORDER.map((s: any) => ({
    stage: s,
    count: fields.filter((f: any) => f.stage === s).length,
  }));

  // Latest updates across this agent's fields
  const recentUpdates = await db.fieldUpdate.findMany({
    where: { field: { agentId: session.user.id } },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      field: { select: { id: true, name: true } },
      author: { select: { name: true } },
    },
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Welcome header */}
      <div className="mb-6">
        <h1 className="page-title">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
          {session.user.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          You have <span className="font-medium text-gray-800">{fields.length}</span> assigned field{fields.length !== 1 ? "s" : ""}.
          {atRiskFields.length > 0 && (
            <span className="text-red-600 font-medium"> {atRiskFields.length} need{atRiskFields.length === 1 ? "s" : ""} attention.</span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="My Fields" value={fields.length} color="blue"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
        />
        <StatsCard title="Active" value={activeFields.length} color="green"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatsCard title="At Risk" value={atRiskFields.length} color="red"
          subtitle={atRiskFields.length > 0 ? "Needs update" : "All clear"}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <StatsCard title="Ready to Harvest" value={fields.filter((f: any) => f.stage === "READY").length} color="yellow"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
        />
      </div>

      {/* At-risk alert */}
      {atRiskFields.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-800">Fields needing attention</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {atRiskFields.map((f: any) => (
                  <Link key={f.id} href={`/agent/fields/${f.id}`}
                    className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 font-medium transition-colors">
                    {f.name} →
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fields grid */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">My Fields</h2>
            <Link href="/agent/fields" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              View all →
            </Link>
          </div>
          {fieldsWithStatus.length === 0 ? (
            <div className="card p-10 text-center text-gray-400">
              <p>No fields assigned yet.</p>
              <p className="text-xs mt-1">Contact your coordinator to get fields assigned.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {fieldsWithStatus.slice(0, 4).map((f: any) => (
                <FieldCard key={f.id} field={f as any} basePath="/agent" />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: stage breakdown + recent activity */}
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="section-title mb-4">Stage Breakdown</h2>
            <div className="space-y-3">
              {stageBreakdown.map(({ stage, count }) => (
                <div key={stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{stage.charAt(0) + stage.slice(1).toLowerCase()}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        stage === "PLANTED" ? "bg-sky-400" :
                        stage === "GROWING" ? "bg-brand-500" :
                        stage === "READY"   ? "bg-earth-500" :
                                                   "bg-gray-400"}`}
                      style={{ width: fields.length > 0 ? `${(count / fields.length) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="section-title mb-4">Recent Activity</h2>
            {recentUpdates.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No updates yet</p>
            ) : (
              <div className="space-y-3">
                {recentUpdates.map((u: any) => (
                  <div key={u.id} className="flex gap-3">
                    <div className="w-1 self-stretch bg-brand-100 rounded-full mt-1 shrink-0" />
                    <div className="min-w-0">
                      <Link href={`/agent/fields/${u.field.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-brand-700 truncate block">
                        {u.field.name}
                      </Link>
                      <StatusBadge variant={u.stage} size="sm" showDot={false} />
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(u.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
