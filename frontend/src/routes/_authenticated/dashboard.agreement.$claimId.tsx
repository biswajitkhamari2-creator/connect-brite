import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { ScrollText, ShieldCheck, AlertTriangle, Loader2, CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/agreement/$claimId")({
  head: () => ({ meta: [{ title: "Accept Service Agreement — ClaimForSure" }] }),
  component: PostPaymentAgreement,
});

const AGREEMENT_VERSION = "post-payment-v1";

function PostPaymentAgreement() {
  const { claimId } = Route.useParams();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; email: string; phone: string } | null>(null);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("full_name,email,phone").eq("user_id", user.id).maybeSingle();
      setProfile(prof as any);
      const { data: existing } = await supabase
        .from("agreement_acceptances")
        .select("id")
        .eq("user_id", user.id)
        .eq("agreement_version", AGREEMENT_VERSION)
        .maybeSingle();
      if (existing) setAlreadyAccepted(true);
      setLoading(false);
    })();
  }, []);

  async function handleAccept() {
    if (!agreed) return toast.error("Please tick the checkbox to accept.");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return toast.error("Session expired."); }
    let ip = "";
    try { ip = (await (await fetch("https://api.ipify.org?format=json")).json()).ip || ""; } catch {}
    const { error } = await supabase.from("agreement_acceptances").insert({
      user_id: user.id,
      agreement_version: AGREEMENT_VERSION,
      agreement_title: "ClaimForSure Post-Payment Service Agreement",
      full_name: profile?.full_name || null,
      email: profile?.email || user.email || null,
      phone: profile?.phone || null,
      ip_address: ip || null,
      user_agent: navigator.userAgent,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Agreement accepted. Thank you!");
    navigate({ to: "/dashboard/claims" });
  }

  if (loading) {
    return <DashboardShell><div className="flex h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div></DashboardShell>;
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="h-5 w-5" /> Payment received successfully
          </div>
          <p className="mt-1 text-sm">Before we proceed with your claim, please read and accept the Service Agreement below.</p>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <ScrollText className="h-5 w-5" />
            <h1 className="font-display text-xl font-bold">ClaimForSure Service Agreement</h1>
          </div>

          <div className="max-h-[420px] overflow-y-auto rounded-lg border border-border bg-slate-50 p-5 text-sm leading-relaxed text-slate-800">
            <p className="mb-3">
              This Service Agreement ("Agreement") is entered into between you (the "Customer") and
              <strong> Sidheswar Enterprises</strong>, operating under the brand <strong>ClaimForSure</strong>
              ("Company"), for insurance claim assistance services.
            </p>

            <h3 className="mt-4 font-bold text-slate-900">1. Scope of Services</h3>
            <p>The Company will guide, prepare, follow-up, negotiate, and escalate your insurance claim on a best-effort basis. The Company does not guarantee any specific outcome by the insurance company.</p>

            <h3 className="mt-4 font-bold text-slate-900">2. Processing Fee (Paid)</h3>
            <p>You have paid the non-refundable processing fee of ₹1,770 (₹1,500 + 18% GST) which covers case setup, documentation review, and initial submission efforts.</p>

            <h3 className="mt-4 font-bold text-slate-900">3. Success Fee — 20% + GST</h3>
            <p>Upon successful settlement/disbursement of your claim by the insurance company, you agree to pay the Company a <strong>success fee of 20% of the settled amount plus 18% GST</strong> on that fee.</p>

            <h3 className="mt-4 font-bold text-slate-900">4. Mandatory Payout Declaration</h3>
            <p>Within <strong>7 (seven) calendar days</strong> of receiving any settlement from the insurance company, you must declare the amount inside your dashboard and upload proof (bank statement / insurer letter). Concealment of the payout is a material breach of this Agreement.</p>

            <h3 className="mt-4 font-bold text-slate-900">5. Late Payment Interest</h3>
            <p>Any success-fee invoice not paid by its due date will accrue interest at <strong>18% per annum</strong>, calculated daily until paid in full.</p>

            <h3 className="mt-4 font-bold text-slate-900">6. Anti-Evasion &amp; Legal Action</h3>
            <p>Willful concealment of the settlement, false declaration, or non-payment of the success fee constitutes cheating and criminal breach of trust under the <strong>Bharatiya Nyaya Sanhita, 2023</strong>. The Company reserves the right to (a) flag your account as a defaulter, (b) restrict future services, and (c) initiate civil recovery and criminal complaints.</p>

            <h3 className="mt-4 font-bold text-slate-900">7. Data &amp; Privacy</h3>
            <p>Documents you upload are stored securely and used only for processing your claim, statutory compliance, and dispute resolution.</p>

            <h3 className="mt-4 font-bold text-slate-900">8. Jurisdiction</h3>
            <p>This Agreement is governed by the laws of India. All disputes are subject to the <strong>exclusive jurisdiction of courts in Bhubaneswar, Odisha</strong>.</p>

            <h3 className="mt-4 font-bold text-slate-900">9. Acknowledgement</h3>
            <p>By ticking the checkbox below and clicking "I Agree", you confirm that you have read, understood, and voluntarily accept every clause above. Your acceptance is recorded with IP address, device details, and timestamp as a legally admissible audit trail.</p>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>You must accept these terms to continue. Download a copy for your records anytime.</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Link to="/service-agreement" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
              <Download className="h-3.5 w-3.5" /> Download full agreement (PDF)
            </Link>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span className="text-sm text-slate-800">
              I, <strong>{profile?.full_name || "the customer"}</strong>, have read and agree to the ClaimForSure Service Agreement, including the 20% + GST success fee, the 7-day payout declaration requirement, and the jurisdiction of Bhubaneswar courts.
            </span>
          </label>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link to="/dashboard/claims" className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50">
              Read later
            </Link>
            <Button onClick={handleAccept} disabled={!agreed || saving} size="lg" className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {alreadyAccepted ? "Re-confirm & Continue" : "I Agree & Continue"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}