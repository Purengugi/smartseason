// src/components/ui/StatusBadge.tsx
import { cn } from "@/lib/utils";
import { FieldStatus } from "@/lib/status";
import { Stage } from "@prisma/client";

type BadgeVariant = FieldStatus | Stage | "ADMIN" | "AGENT";

const variantClasses: Record<string, string> = {
  // Field status
  ACTIVE:    "bg-brand-50 text-brand-700 ring-1 ring-brand-200",
  AT_RISK:   "bg-red-50 text-red-700 ring-1 ring-red-200",
  COMPLETED: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
  // Stages
  PLANTED:   "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  GROWING:   "bg-brand-50 text-brand-700 ring-1 ring-brand-200",
  READY:     "bg-earth-50 text-earth-700 ring-1 ring-earth-200",
  HARVESTED: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
  // Roles
  ADMIN:     "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  AGENT:     "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
};

const dotClasses: Record<string, string> = {
  ACTIVE:    "bg-brand-500",
  AT_RISK:   "bg-red-500 animate-pulse",
  COMPLETED: "bg-gray-400",
  PLANTED:   "bg-sky-500",
  GROWING:   "bg-brand-500",
  READY:     "bg-earth-500",
  HARVESTED: "bg-gray-400",
  ADMIN:     "bg-violet-500",
  AGENT:     "bg-blue-500",
};

const labels: Record<string, string> = {
  AT_RISK: "At Risk",
  HARVESTED: "Harvested",
};

interface Props {
  variant: BadgeVariant;
  size?: "sm" | "md";
  showDot?: boolean;
}

export function StatusBadge({ variant, size = "md", showDot = true }: Props) {
  const label = labels[variant] ?? variant.charAt(0) + variant.slice(1).toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        variantClasses[variant] ?? "bg-gray-100 text-gray-600"
      )}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", dotClasses[variant] ?? "bg-gray-400")} />
      )}
      {label}
    </span>
  );
}
