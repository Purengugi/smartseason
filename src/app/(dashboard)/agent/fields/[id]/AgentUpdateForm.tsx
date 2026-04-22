// src/app/(dashboard)/agent/fields/[id]/AgentUpdateForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { StatusBadge } from "@/components/ui/StatusBadge";

type Stage = "PLANTED" | "GROWING" | "READY" | "HARVESTED";

const STAGES: Stage[] = ["PLANTED", "GROWING", "READY", "HARVESTED"];
const STAGE_LABELS: Record<Stage, string> = {
  PLANTED: "Planted",
  GROWING: "Growing",
  READY: "Ready to Harvest",
  HARVESTED: "Harvested",
};

interface Props {
  fieldId: string;
  currentStage: Stage;
  suggestedNext: Stage | null;
}

export function AgentUpdateForm({ fieldId, currentStage, suggestedNext }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(currentStage);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!notes.trim() && stage === currentStage) {
      toast.error("Please add a note or change the stage");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/fields/${fieldId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, notes }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Update logged!");
      setNotes("");
      router.refresh();
    } else {
      toast.error("Failed to log update");
    }
  }

  return (
    <div className="card p-5">
      <h2 className="section-title mb-1">Log Field Update</h2>
      <p className="text-xs text-gray-400 mb-4">Record the current state of this field</p>

      {suggestedNext && (
        <div className="mb-4 p-3 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-between">
          <p className="text-sm text-brand-700">
            <span className="font-semibold">Suggested next stage:</span>{" "}
            <StatusBadge variant={suggestedNext} size="sm" />
          </p>
          <button
            type="button"
            onClick={() => setStage(suggestedNext)}
            className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
          >
            Apply →
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Current Stage</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STAGES.map((s: any) => (
              <button
                key={s}
                type="button"
                onClick={() => setStage(s)}
                className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                  stage === s
                    ? "border-brand-400 bg-brand-50 text-brand-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className={`w-2 h-2 rounded-full mb-1.5 ${
                  s === "PLANTED"  ? "bg-sky-400" :
                  s === "GROWING"  ? "bg-brand-500" :
                  s === "READY"    ? "bg-earth-500" :
                                     "bg-gray-400"
                }`} />
                {STAGE_LABELS[s as Stage]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">
            Observation Notes
            <span className="text-gray-400 font-normal ml-1">(recommended)</span>
          </label>
          <textarea
            className="input resize-none"
            rows={4}
            placeholder="Describe what you observed — crop health, any pests or diseases, weather effects, irrigation status..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-2.5">
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Saving...
            </>
          ) : "Log Update"}
        </button>
      </form>
    </div>
  );
}
