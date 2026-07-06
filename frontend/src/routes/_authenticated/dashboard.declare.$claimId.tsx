import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/declare/$claimId")({
  component: DeclarePayout,
  head: () => ({ meta: [{ title: "Declare Insurer Payout — ClaimForSure" }] }),
});

type Claim = {
  id: string;
  claim_id: string;
  user_id: string;
  insurance_company: string;
  status: string;
  payment_status: string;
  declared_payout_paise: number | null;
  payout_verification_status: string;
  payout_insurer_name: string | null;
};

function DeclarePayout() {
  const { claimId } = Route.useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [insurer, setInsurer] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("claims")
        .select("id, claim_id, user_id, insurance_company, status, payment_status, declared_payout_paise, payout_verification_status, payout_insurer_name")
        .eq("id", claimId)
        .maybeSingle();
      if (error) toast.error(error.message);
      if (data) {
        setClaim(data as Claim);
        setInsurer(data.payout_insurer_name || data.insurance_company || "");
        if (data.declared_payout_paise) setAmount((data.declared_payout_paise / 100).toString());
      }
      setLoading(false);
    })();
  }, [claimId]);

  async function submit() {
    if (!claim) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return toast.error("Enter a valid payout amount");
    if (!insurer.trim()) return toast.error("Enter insurer name");
    if (!file) return toast.error("Upload proof of payout (bank statement or insurer letter)");
    if (file.size > 10 * 1024 * 1024) return toast.error("File too large (max 10MB)");

    setSubmitting(true);
    try {
      const ext = file.name.split(".").pop() || "pdf";
      const path = `payouts/${claim.user_id}/${claim.id}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("claim-documents").upload(path, file, { upsert: false });
      if (up.error) throw up.error;

      const { error } = await supabase
        .from("claims")
        .update({
          declared_payout_paise: Math.round(amt * 100),
          payout_declared_at: new Date().toISOString(),
          payout_proof_path: path,
          payout_insurer_name: insurer.trim(),
          payout_verification_status: "pending",
        })
        .eq("id", claim.id);
      if (error) throw error;
      toast.success("Payout declared. Our team will verify and issue your GST invoice.");
      navigate({ to: "/dashboard/invoices" });
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <DashboardShell><div className="flex h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div></DashboardShell>;
  }
  if (!claim) {
    return <DashboardShell><div className="rounded-xl border border-border bg-card p-8 text-center"><AlertCircle className="mx-auto h-10 w-10 text-destructive" /><p className="mt-3 font-semibold">Claim not found.</p><Link to="/dashboard/claims" className="mt-4 inline-block text-primary underline">Back to claims</Link></div></DashboardShell>;
  }

  const alreadyDeclared = claim.payout_verification_status === "pending" || claim.payout_verification_status === "verified";
  const amt = Number(amount) || 0;
  const fee = +(amt * 0.20).toFixed(2);
  const gst = +(fee * 0.18).toFixed(2);
  const total = +(fee + gst).toFixed(2);

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-bold">Declare insurer payout</h1>
        <p className="mt-1 text-sm text-muted-foreground">For claim <span className="font-mono">{claim.claim_id}</span>. Once your insurer pays you, declare the amount here. We will verify and raise a GST invoice for our 20% + GST success fee.</p>

        {alreadyDeclared && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <div>You have already declared a payout (status: <strong>{claim.payout_verification_status}</strong>). Submitting again will overwrite the previous declaration and reset verification.</div>
          </div>
        )}

        <div className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6">
          <Field label="Insurer name">
            <input value={insurer} onChange={(e) => setInsurer(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. HDFC Ergo" />
          </Field>
          <Field label="Payout amount received (₹)">
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. 250000" />
          </Field>
          <Field label="Proof (bank statement / insurer letter, PDF or image, max 10MB)">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-background px-3 py-3 text-sm hover:bg-muted/30">
              <Upload className="h-4 w-4" />
              <span className="truncate">{file ? file.name : "Choose file"}</span>
              <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </Field>

          {amt > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expected invoice</div>
              <dl className="mt-2 space-y-1">
                <div className="flex justify-between"><dt>Success fee (20%)</dt><dd>₹{fee.toLocaleString("en-IN")}</dd></div>
                <div className="flex justify-between"><dt>GST (18%)</dt><dd>₹{gst.toLocaleString("en-IN")}</dd></div>
                <div className="flex justify-between border-t border-border pt-1 font-bold"><dt>Total payable</dt><dd>₹{total.toLocaleString("en-IN")}</dd></div>
              </dl>
            </div>
          )}

          <Button onClick={submit} disabled={submitting} className="w-full" size="lg">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Submit declaration</>}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">False declarations may attract legal action under your signed service agreement.</p>
        </div>
      </div>
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}