// src/app/(dashboard)/admin/fields/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { computeStatus } from "@/lib/status";
import { FieldCard } from "@/components/FieldCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminFieldsPage({
  searchParams,
}: {
  searchParams: { status?: string; stage?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const fields = await db.field.findMany({
    include: {
      agent: { select: { id: true, name: true, email: true } },
      updates: { orderBy: { createdAt: "desc" }, take: 10 },
    },
    orderBy: { createdAt: "desc" },
  });

  const fieldsWithStatus = fields.map((f: any) => ({
    ...f,
    status: computeStatus(f),
  }));

  // Filter
  const statusFilter = searchParams.status?.toUpperCase();
  const stageFilter  = searchParams.stage?.toUpperCase();
  const filtered = fieldsWithStatus.filter((f: any) => {
    if (statusFilter && f.status !== statusFilter) return false;
    if (stageFilter && f.stage !== stageFilter) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">All Fields</h1>
          <p className="text-sm text-gray-500 mt-1">{fieldsWithStatus.length} total fields</p>
        </div>
        <Link href="/admin/fields/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Field
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { label: "All", href: "/admin/fields" },
          { label: "Active",    href: "/admin/fields?status=active" },
          { label: "At Risk",   href: "/admin/fields?status=at_risk" },
          { label: "Completed", href: "/admin/fields?status=completed" },
        ].map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              (label === "All" && !statusFilter) ||
              (statusFilter && href.includes(statusFilter.toLowerCase()))
                ? "bg-brand-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-gray-500 font-medium">No fields found</p>
          <Link href="/admin/fields/new" className="btn-primary mt-4 inline-flex">Add your first field</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((field: any) => (
            <FieldCard key={field.id} field={field as any} basePath="/admin" />
          ))}
        </div>
      )}
    </div>
  );
}
