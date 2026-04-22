// src/app/(dashboard)/admin/fields/[id]/FieldActions.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Stage = "PLANTED" | "GROWING" | "READY" | "HARVESTED";

interface Props {
  field: { id: string; stage: Stage; agentId: string | null };
  agents: { id: string; name: string }[];
}

const STAGES: Stage[] = ["PLANTED", "GROWING", "READY", "HARVESTED"];

export function FieldActions({ field, agents }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(field.stage);
  const [notes, setNotes] = useState("");
  const [agentId, setAgentId] = useState(field.agentId ?? "");
  const [updating, setUpdating] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function submitUpdate(e: React.FormEvent) {
    e.preventDefault();
    setUpdating(true);
    const res = await fetch(`/api/fields/${field.id}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, notes }),
    });
    setUpdating(false);
    if (res.ok) {
      toast.success("Field updated!");
      setNotes("");
      router.refresh();
    } else {
      toast.error("Update failed");
    }
  }

  async function reassign() {
    setReassigning(true);
    const res = await fetch(`/api/fields/${field.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: agentId || null }),
    });
    setReassigning(false);
    if (res.ok) {
      toast.success("Agent reassigned");
      router.refresh();
    } else {
      toast.error("Reassignment failed");
    }
  }

  async function deleteField() {
    if (!confirm("Delete this field? This action cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/fields/${field.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      toast.success("Field deleted");
      router.push("/admin/fields");
    } else {
      toast.error("Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      {/* Log update */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Log Update</h2>
        <form onSubmit={submitUpdate} className="space-y-3">
          <div>
            <label className="label">Stage</label>
            <select className="input" value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
              {STAGES.map((s: any) => (
                <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Observation Notes</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Describe what you observed in the field..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <button type="submit" disabled={updating} className="btn-primary">
            {updating ? "Saving..." : "Save Update"}
          </button>
        </form>
      </div>

      {/* Reassign agent */}
      <div className="card p-5">
        <h2 className="section-title mb-3">Assign Agent</h2>
        <div className="flex gap-2">
          <select className="input flex-1" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            <option value="">Unassigned</option>
            {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button onClick={reassign} disabled={reassigning} className="btn-secondary whitespace-nowrap">
            {reassigning ? "Saving..." : "Update"}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-5 border border-red-100">
        <h2 className="section-title text-red-700 mb-1">Danger Zone</h2>
        <p className="text-xs text-gray-500 mb-3">Permanently delete this field and all its update history.</p>
        <button onClick={deleteField} disabled={deleting} className="btn-danger text-sm">
          {deleting ? "Deleting..." : "Delete Field"}
        </button>
      </div>
    </div>
  );
}
