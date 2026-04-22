// src/components/FieldCard.tsx
"use client";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import { FieldWithRelations } from "@/types";
import { STAGE_ORDER } from "@/lib/status";

interface Props {
  field: FieldWithRelations;
  basePath: string;
}

export function FieldCard({ field, basePath }: Props) {
  const stageIndex   = STAGE_ORDER.indexOf(field.stage);
  const stagePercent = Math.round(((stageIndex + 1) / STAGE_ORDER.length) * 100);

  return (
    <Link
      href={`${basePath}/fields/${field.id}`}
      className="card p-5 hover:shadow-card-hover transition-all duration-200 group block"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-brand-700 transition-colors">
            {field.name}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{field.cropType}</p>
        </div>
        <StatusBadge variant={field.status} />
      </div>

      {/* Stage progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Stage</span>
          <span className="font-medium text-gray-600">{field.stage.charAt(0) + field.stage.slice(1).toLowerCase()}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500"
            style={{ width: `${stagePercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {STAGE_ORDER.map((s, i) => (
            <div key={s} className={`text-[10px] ${i <= stageIndex ? "text-brand-600 font-medium" : "text-gray-300"}`}>
              {s.charAt(0) + s.slice(1, 4).toLowerCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 border-t border-gray-50 pt-3">
        <div>
          <span className="text-gray-400">Planted</span>
          <p className="text-gray-700 font-medium">{formatDate(field.plantingDate)}</p>
        </div>
        {field.agent && (
          <div>
            <span className="text-gray-400">Agent</span>
            <p className="text-gray-700 font-medium truncate">{field.agent.name}</p>
          </div>
        )}
        {field.location && (
          <div className="col-span-2 flex items-center gap-1 text-gray-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {field.location}
          </div>
        )}
      </div>
    </Link>
  );
}
