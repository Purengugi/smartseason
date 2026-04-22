// src/app/(dashboard)/admin/fields/new/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

export default function NewFieldPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", cropType: "", plantingDate: "", location: "", areaAcres: "", agentId: "",
  });

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((data) => {
      setAgents(data.filter((u: any) => u.role === "AGENT"));
    });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Field created!");
      router.push("/admin/fields");
      router.refresh();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Failed to create field");
    }
  }

  const CROP_TYPES = ["Maize", "Beans", "Wheat", "Rice", "Sorghum", "Millet", "Irish Potatoes",
    "Sweet Potatoes", "Cassava", "Sunflower", "Soybean", "Groundnuts", "Other"];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/fields" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="page-title">New Field</h1>
          <p className="text-sm text-gray-500 mt-0.5">Register a new field in the system</p>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="name">Field Name *</label>
              <input id="name" name="name" required className="input"
                placeholder="e.g. Kiambu North Plot A"
                value={form.name} onChange={handleChange} />
            </div>
            <div>
              <label className="label" htmlFor="cropType">Crop Type *</label>
              <select id="cropType" name="cropType" required className="input"
                value={form.cropType} onChange={handleChange}>
                <option value="">Select crop...</option>
                {CROP_TYPES.map((c: any) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="plantingDate">Planting Date *</label>
              <input id="plantingDate" name="plantingDate" type="date" required className="input"
                value={form.plantingDate} onChange={handleChange} />
            </div>
            <div>
              <label className="label" htmlFor="location">Location</label>
              <input id="location" name="location" className="input"
                placeholder="e.g. Kiambu, Kenya"
                value={form.location} onChange={handleChange} />
            </div>
            <div>
              <label className="label" htmlFor="areaAcres">Area (acres)</label>
              <input id="areaAcres" name="areaAcres" type="number" step="0.1" min="0" className="input"
                placeholder="e.g. 5.5"
                value={form.areaAcres} onChange={handleChange} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="agentId">Assign to Agent</label>
              <select id="agentId" name="agentId" className="input"
                value={form.agentId} onChange={handleChange}>
                <option value="">Unassigned</option>
                {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Creating..." : "Create Field"}
            </button>
            <Link href="/admin/fields" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
