"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Branch = {
  id: string;
  name: string;
  city: string;
  state: string;
  driverCount: number;
  lrsThisMonth: number;
  freight: number;
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Telangana");

  useEffect(() => {
    fetch("/api/branches").then((r) => r.json()).then((d) => d.success && setBranches(d.data));
  }, []);

  async function createBranch() {
    const res = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, city, state }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Branch created");
      setName("");
      setCity("");
      fetch("/api/branches").then((r) => r.json()).then((d) => d.success && setBranches(d.data));
    } else toast.error(data.error);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Branch Management</h1>
      <p className="text-slate-500">{branches.length} branches configured</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {branches.map((b) => (
          <div key={b.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold">{b.name}</h3>
            <p className="text-sm text-slate-500">{b.city}, {b.state}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div><p className="font-bold">{b.driverCount}</p><p className="text-xs text-slate-500">Drivers</p></div>
              <div><p className="font-bold">{b.lrsThisMonth}</p><p className="text-xs text-slate-500">LRs</p></div>
              <div><p className="font-bold text-emerald-600">₹{(b.freight / 100000).toFixed(1)}L</p><p className="text-xs text-slate-500">Freight</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="font-semibold">+ Add New Branch</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div><Label>Branch Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vijayawada Branch" className="mt-1" /></div>
          <div><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Vijayawada" className="mt-1" /></div>
          <div><Label>State</Label><Input value={state} onChange={(e) => setState(e.target.value)} className="mt-1" /></div>
        </div>
        <Button onClick={createBranch} className="mt-4 bg-violet-600 hover:bg-violet-700">Create Branch</Button>
      </div>
    </div>
  );
}
