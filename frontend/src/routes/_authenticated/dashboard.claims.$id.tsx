import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Upload, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { api, type ClaimDetail, type ClaimDocument } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/claims/$id")({
  component: ClaimDetailPage,
  head: () => ({ meta: [{ title: "Claim — ClaimForSure" }] }),
});

function ClaimDetailPage() {
  const { id } = Route.useParams();
  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [docs, setDocs] = useState<ClaimDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const autoOpenedRef = useRef(false);

  async function load() {
    try {
      const res = await api.claims.get(id);
      setClaim(res.data);
      // Load documents
      const docsRes = await api.claims.documents(id);
      setDocs(Array.isArray(docsRes.data) ? docsRes.data : []);
    } catch (err) {
      toast.error((err as Error).message || "Failed to load claim");
    }
  }

  useEffect(() => { void load(); }, [id]);

  // Auto-open file picker when admin requested more documents
  useEffect(() => {
    if (!claim) return;
    if (claim.status === "pending_docs" && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      setTimeout(() => fileInputRef.current?.click(), 250);
    }
    if (claim.status !== "pending_docs") autoOpenedRef.current = false;
  }, [claim]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !claim) return;
    setUploading(true);
    try {
      await api.claims.upload(claim.id, file, "other");
      toast.success("Document uploaded");
      void load();
    } catch (err) {
      toast.error((err as Error).message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (!claim) return (
    <DashboardShell>
      <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    </DashboardShell>
  );

  const editable = claim.status === "submitted" || claim.status === "pending_docs";
  const needsMore = claim.status === "pending_docs";

  return (
    <DashboardShell>
      <Link to="/dashboard/claims" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to claims
      </Link>
      <div className="mt-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{claim.claim_number}</h1>
          <p className="text-sm text-muted-foreground">Submitted {new Date(claim.created_at).toLocaleDateString()}</p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize">{claim.status.replace(/_/g, " ")}</span>
      </div>

      {needsMore && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Additional documents requested</p>
            <p className="mt-0.5 text-amber-800">Our team needs more documents to proceed with this claim. Please upload them below — the file picker has been opened for you.</p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Info label="Category" value={claim.category} />
        <Info label="Insurer" value={claim.insurer_name ?? "—"} />
        <Info label="Policy number" value={claim.policy_number ?? "—"} />
        <Info label="Claim amount" value={claim.claim_amount != null ? `₹${Number(claim.claim_amount).toLocaleString("en-IN")}` : "—"} />
        <Info label="Priority" value={claim.priority} />
        <Info label="Status" value={claim.status.replace(/_/g, " ")} />
        <div className="md:col-span-2"><Info label="Description" value={claim.description} /></div>
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Documents</h2>
          {editable && (
            <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 ${needsMore ? "bg-amber-500 hover:bg-amber-600" : "bg-primary"}`}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
              <input ref={fileInputRef} type="file" hidden onChange={handleUpload} disabled={uploading} accept="image/*,.pdf,.doc,.docx" />
            </label>
          )}
        </div>
        <ul className="mt-4 space-y-2">
          {docs.length === 0 && <li className="text-sm text-muted-foreground">No documents uploaded yet.</li>}
          {docs.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm">
              <span className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {doc.original_name}
                <span className="ml-1 text-xs text-muted-foreground">({(doc.file_size / 1024).toFixed(0)} KB)</span>
              </span>
            </li>
          ))}
        </ul>
        {!editable && <p className="mt-4 text-xs text-muted-foreground">Documents can only be uploaded while the claim is submitted or when our team requests more documents.</p>}
      </section>
    </DashboardShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
