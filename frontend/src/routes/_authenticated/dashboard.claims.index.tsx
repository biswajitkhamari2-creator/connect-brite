import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FilePlus2, Loader2, FileText, IndianRupee, CheckCircle2, Banknote } from "lucide-react";
import { api, type ClaimSummary } from "@/lib/api";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/claims/")({
  component: ClaimsList,
  head: () => ({ meta: [{ title: "My Claims — ClaimForSure" }] }),
});

function ClaimsList() {
  const [claims, setClaims] = useState<ClaimSummary[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.claims.list();
        setClaims(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        toast.error((err as Error).message || "Failed to load claims");
        setClaims([]);
      }
    })();
  }, []);

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-foreground">My Claims</h1>
        <Link to="/dashboard/claims/new" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <FilePlus2 className="h-4 w-4" /> New Claim
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        {claims === null ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : claims.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">You haven't submitted any claims yet.</p>
            <Link to="/dashboard/claims/new" className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              <FilePlus2 className="h-4 w-4" /> Submit your first claim
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Claim #</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Insurer</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => {
                const isApproved = c.status === "resolved";
                const isRejected = c.status === "rejected";
                return (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{c.claim_number}</td>
                    <td className="px-4 py-3 capitalize">{c.category}</td>
                    <td className="px-4 py-3">{c.insurer_name ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {c.claim_amount != null ? `₹${Number(c.claim_amount).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        isApproved ? "bg-emerald-100 text-emerald-700" :
                        isRejected ? "bg-rose-100 text-rose-700" :
                        c.status === "pending_docs" ? "bg-amber-100 text-amber-700" :
                        c.status === "escalated" ? "bg-indigo-100 text-indigo-700" :
                        "bg-muted text-foreground"
                      }`}>{c.status.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link to="/dashboard/claims/$id" params={{ id: String(c.id) }} className="text-xs font-medium text-primary hover:underline">View</Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}
