import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Eye, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { BrandLockup } from "@/components/BrandLockup";

export const Route = createFileRoute("/admin/payouts")({
  ssr: false,
  head: () => ({ meta: [{ title: "Payout Verifications — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminPayouts,
});

type Row = {
  id: string;
  claim_id: string;
  user_id: string;
  full_name: string;
  email: string;
  insurance_company: string;
  payout_insurer_name: string | null;
  declared_payout_paise: number;
  payout_declared_at: string;
  payout_proof_path: string | null;
  payout_verification_status: string;
  success_fee_invoice_no: string | null;
};

function AdminPayouts() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/admin/login" }); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); return; }
      setChecking(false);
      load();
    })();
  }, [navigate]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("claims")
      .select("id, claim_id, user_id, full_name, email, insurance_company, payout_insurer_name, declared_payout_paise, payout_declared_at, payout_proof_path, payout_verification_status, success_fee_invoice_no")
      .not("declared_payout_paise", "is", null)
      .order("payout_declared_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  async function viewProof(path: string) {
    const { data, error } = await supabase.storage.from("claim-documents").download(path);
    if (error || !data) { toast.error(error?.message || "Cannot open proof"); return; }
    const blob = new Blob([data], { type: data.type || "application/octet-stream" });
    setProofUrl(URL.createObjectURL(blob));
  }

  async function issueInvoice(row: Row) {
    if (!confirm(`Issue invoice for 20%+GST on ₹${(row.declared_payout_paise / 100).toLocaleString("en-IN")}?`)) return;
    setBusy(row.id);
    const { data, error } = await supabase.rpc("issue_success_fee_invoice", { _claim_id: row.id });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    const inv = Array.isArray(data) ? data[0] : data;
    toast.success(`Invoice ${inv?.invoice_no} issued (₹${((inv?.total_paise ?? 0) / 100).toLocaleString("en-IN")})`);
    load();
  }

  async function reject(row: Row) {
    const reason = prompt("Reason for rejecting this declaration (visible to customer):");
    if (!reason) return;
    setBusy(row.id);
    const { error } = await supabase.from("claims").update({
      payout_verification_status: "rejected",
    }).eq("id", row.id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Declaration rejected");
    load();
  }

  if (checking) return <div className="grid min-h-screen place-items-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-indigo-600 text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link to="/admin" className="flex items-center" aria-label="Claim For Sure — by Sidheshwar Enterprises admin">
            <BrandLockup size="xs" layout="inline" tone="light" />
          </Link>
          <Link to="/admin" className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6 sm:px-6">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-extrabold text-slate-900">Payout verifications</h1>
          <Link to="/admin/invoices" className="ml-auto rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800">View invoices →</Link>
        </div>
        <p className="mt-1 text-sm text-slate-500">Verify customer declarations of insurer payouts, then issue the 20%+GST invoice.</p>

        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          {loading ? (
            <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">No payout declarations yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr><th className="px-4 py-3 text-left">Claim</th><th className="px-4 py-3 text-left">Customer</th><th className="px-4 py-3 text-left">Insurer</th><th className="px-4 py-3 text-right">Declared</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-right">Action</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const amt = (r.declared_payout_paise / 100).toLocaleString("en-IN");
                  return (
                    <tr key={r.id} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-3 font-mono text-xs">{r.claim_id}<div className="mt-1 text-[10px] text-slate-400">{new Date(r.payout_declared_at).toLocaleString("en-IN")}</div></td>
                      <td className="px-4 py-3"><div className="font-semibold">{r.full_name}</div><div className="text-xs text-slate-500">{r.email}</div></td>
                      <td className="px-4 py-3">{r.payout_insurer_name || r.insurance_company}</td>
                      <td className="px-4 py-3 text-right font-bold">₹{amt}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                          r.success_fee_invoice_no ? "bg-emerald-100 text-emerald-700" :
                          r.payout_verification_status === "rejected" ? "bg-rose-100 text-rose-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>{r.success_fee_invoice_no ? "invoiced" : r.payout_verification_status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {r.payout_proof_path && (
                            <button onClick={() => viewProof(r.payout_proof_path!)} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold hover:bg-slate-200"><Eye className="h-3 w-3" /> Proof</button>
                          )}
                          {!r.success_fee_invoice_no && r.payout_verification_status !== "rejected" && (
                            <>
                              <button onClick={() => issueInvoice(r)} disabled={busy === r.id} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                                {busy === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Issue invoice
                              </button>
                              <button onClick={() => reject(r)} disabled={busy === r.id} className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"><XCircle className="h-3 w-3" /> Reject</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {proofUrl && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => { URL.revokeObjectURL(proofUrl); setProofUrl(null); }}>
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-xl bg-white p-2" onClick={(e) => e.stopPropagation()}>
            <iframe src={proofUrl} className="h-[80vh] w-full" title="Payout proof" />
          </div>
        </div>
      )}
    </div>
  );
}