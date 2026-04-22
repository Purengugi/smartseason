// src/app/(dashboard)/admin/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { computeStatus } from "@/lib/status";
import { StatsCard } from "@/components/ui/StatsCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";

import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const [fields, agents, recentUpdates] = await Promise.all([
    db.field.findMany({
      include: {
        updates: { orderBy: { createdAt: "desc" }, take: 5 },
        agent: { select: { id: true, name: true } },
      },
    }),
    db.user.findMany({
      where: { role: "AGENT" },
      include: { _count: { select: { fields: true } } },
    }),
    db.fieldUpdate.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        field: { select: { id: true, name: true } },
        author: { select: { name: true } },
      },
    }),
  ]);

  const statuses = fields.map((f: any) => computeStatus(f));
  const stats = {
    total:     fields.length,
    active:    statuses.filter((s: any) => s === "ACTIVE").length,
    atRisk:    statuses.filter((s: any) => s === "AT_RISK").length,
    completed: statuses.filter((s: any) => s === "COMPLETED").length,
    planted:   fields.filter((f: any) => f.stage === "PLANTED").length,
    growing:   fields.filter((f: any) => f.stage === "GROWING").length,
    ready:     fields.filter((f: any) => f.stage === "READY").length,
    harvested: fields.filter((f: any) => f.stage === "HARVESTED").length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Season overview - {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Fields" value={stats.total} color="blue"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
        />
        <StatsCard title="Active" value={stats.active} color="green"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatsCard title="At Risk" value={stats.atRisk} color="red"
          subtitle={stats.atRisk > 0 ? "Needs attention" : "All clear"}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <StatsCard title="Harvested" value={stats.harvested} color="gray"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage breakdown */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Stage Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "Planted",   value: stats.planted,   max: stats.total, color: "bg-sky-500" },
              { label: "Growing",   value: stats.growing,   max: stats.total, color: "bg-brand-500" },
              { label: "Ready",     value: stats.ready,     max: stats.total, color: "bg-earth-500" },
              { label: "Harvested", value: stats.harvested, max: stats.total, color: "bg-gray-400" },
            ].map(({ label, value, max, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-semibold text-gray-900">{value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-700`}
                    style={{ width: max > 0 ? `${(value / max) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent summary */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Field Agents</h2>
            <Link href="/admin/agents" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              Manage →
            </Link>
          </div>
          {agents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No agents yet</p>
          ) : (
            <div className="space-y-2">
              {agents.map((agent: any) => (
                <div key={agent.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-xs font-bold text-brand-700">
                      {agent.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                      <p className="text-xs text-gray-400">{agent.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {agent._count.fields} fields
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
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
                    <Link href={`/admin/fields/${u.field.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-brand-700 truncate block">
                      {u.field.name}
                    </Link>
                    <p className="text-xs text-gray-500">
                      <StatusBadge variant={u.stage} size="sm" showDot={false} /> · {u.author.name}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(u.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* At-risk fields alert */}
      {stats.atRisk > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">{stats.atRisk} field{stats.atRisk > 1 ? "s" : ""} need attention</p>
            <p className="text-xs text-red-600 mt-0.5">
              These fields may be stagnant or overdue for a stage update.{" "}
              <Link href="/admin/fields" className="underline font-medium">View fields →</Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
