// src/components/ui/StatsCard.tsx
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: "green" | "red" | "yellow" | "gray" | "blue";
}

const colorMap = {
  green:  { bg: "bg-brand-50",  icon: "text-brand-600",  ring: "ring-brand-100" },
  red:    { bg: "bg-red-50",    icon: "text-red-500",    ring: "ring-red-100" },
  yellow: { bg: "bg-earth-50",  icon: "text-earth-600",  ring: "ring-earth-100" },
  gray:   { bg: "bg-gray-100",  icon: "text-gray-500",   ring: "ring-gray-200" },
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   ring: "ring-blue-100" },
};

export function StatsCard({ title, value, subtitle, icon, color = "green" }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={cn("p-3 rounded-xl ring-1", c.bg, c.ring)}>
        <span className={cn("w-5 h-5", c.icon)}>{icon}</span>
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
