import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Shield, LogOut, Search, Loader2, FileText, Clock, CheckCircle2,
  IndianRupee, RefreshCw, Eye, Mail, Phone, MapPin, X, ExternalLink, Download,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLockup } from "@/components/BrandLockup";
import { supabase } from "@/integrations/supabase/client";

type Claim = {
  id: string;
  claim_id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  insurance_type: string;
  insurance_company: string;
  policy_number: string;
  claim_amount: number | string;
  rejection_date: string;
  rejection_reason: string;
  status: string;
  created_at: string;
  documents: string[] | null;
};
type DocumentViewer = { path: string; url: string; blob: Blob; kind: "image" | "pdf" | "other" };

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin Dashboard — ClaimForSure" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminDashboard,
});

const STATUSES = [
  "pending",
  "in-review",
  "expert-review",
  "more-documents-required",
  "approved",
  "rejected",
  "resolved",
] as const;

const QUICK_ACTIONS: { value: string; label: string; className: string }[] = [
  { value: "approved", label: "Approve", className: "bg-emerald-600 hover:bg-emerald-700 text-white" },
  { value: "rejected", label: "Deny", className: "bg-rose-600 hover:bg-rose-700 text-white" },
  { value: "more-documents-required", label: "Need more documents", className: "bg-amber-500 hover:bg-amber-600 text-white" },
  { value: "expert-review", label: "Send for expert review", className: "bg-indigo-600 hover:bg-indigo-700 text-white" },
];
const STATUS_PILL: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  "in-review": "bg-blue-100 text-blue-700",
  legal: "bg-fuchsia-100 text-fuchsia-700",
  resolved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};
const STATUS_BORDER: Record<string, string> = {
  pending: "border-amber-400",
  "in-review": "border-blue-500",
  legal: "border-fuchsia-500",
  resolved: "border-emerald-500",
  rejected: "border-rose-500",
};

function getFileName(path: string) {
  return decodeURIComponent(path.split("/").pop() || path || "Document");
}

function getDocumentKind(path: string): DocumentViewer["kind"] {
  const ext = path.split("?")[0].split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg"].includes(ext || "")) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Claim | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/admin/login" }); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) { navigate({ to: "/admin/login" }); return; }
      setChecking(false);
      fetchClaims();
    })();
  }, [navigate]);

  async function fetchClaims() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("claims")
        .select("id, claim_id, full_name, email, phone, city, state, insurance_type, insurance_company, policy_number, claim_amount, rejection_date, rejection_reason, status, created_at, documents")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setClaims((data ?? []) as unknown as Claim[]);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load claims");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const { error } = await supabase.from("claims").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success("Status updated");
      setClaims((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      setSelected((s) => (s && s.id === id ? { ...s, status } : s));
    } catch (e: any) {
      toast.error(e?.message || "Failed to update status");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  }

  const filtered = useMemo(() => {
    return claims.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.claim_id.toLowerCase().includes(q) ||
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.insurance_company.toLowerCase().includes(q)
      );
    });
  }, [claims, search, statusFilter]);

  const stats = useMemo(() => {
    const total = claims.length;
    const pending = claims.filter((c) => c.status === "pending").length;
    const resolved = claims.filter((c) => c.status === "resolved").length;
    const amount = claims.reduce((sum, c) => sum + Number(c.claim_amount || 0), 0);
    return { total, pending, resolved, amount };
  }, [claims]);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Vibrant header */}
      <header className="sticky top-0 z-30 bg-indigo-600 text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link to="/" className="flex items-center" aria-label="Claim For Sure — by Sidheshwar Enterprises">
            <BrandLockup size="xs" layout="inline" tone="light" />
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/admin/rewards" className="inline-flex items-center rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-bold hover:bg-white/20 sm:px-3 sm:text-xs">Rewards</Link>
            <Link to="/admin/notices" className="inline-flex items-center rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-bold hover:bg-white/20 sm:px-3 sm:text-xs">Notices</Link>
            <Link to="/admin/payouts" className="inline-flex items-center rounded-lg bg-amber-400 px-2.5 py-1.5 text-[11px] font-extrabold text-slate-900 hover:bg-amber-300 sm:px-3 sm:text-xs">Payouts</Link>
            <Link to="/admin/invoices" className="inline-flex items-center rounded-lg bg-emerald-400 px-2.5 py-1.5 text-[11px] font-extrabold text-slate-900 hover:bg-emerald-300 sm:px-3 sm:text-xs">Invoices</Link>
            <Link to="/admin/promocodes" className="inline-flex items-center rounded-lg bg-pink-400 px-2.5 py-1.5 text-[11px] font-extrabold text-slate-900 hover:bg-pink-300 sm:px-3 sm:text-xs">Promo Codes</Link>
            <button onClick={fetchClaims} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20">
              <RefreshCw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-extrabold text-slate-900 hover:bg-amber-300">
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-6">
        {/* Vibrant stat pills */}
        <section className="-mx-1 flex gap-3 overflow-x-auto pb-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible md:grid-cols-4">
          <StatPill color="bg-indigo-600 shadow-indigo-300/50" label="Total" value={stats.total} icon={<FileText className="h-4 w-4" />} />
          <StatPill color="bg-amber-400 shadow-amber-300/60" label="Pending" value={stats.pending} icon={<Clock className="h-4 w-4" />} />
          <StatPill color="bg-emerald-500 shadow-emerald-300/60" label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="h-4 w-4" />} />
          <StatPill color="bg-fuchsia-500 shadow-fuchsia-300/60" label="Total value" value={`₹${stats.amount.toLocaleString("en-IN")}`} icon={<IndianRupee className="h-4 w-4" />} />
        </section>

        {/* Search & filters */}
        <div className="mt-2 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search claims by name, email, phone, claim ID…"
              className="w-full rounded-2xl border-0 bg-white py-3.5 pl-11 pr-4 text-sm shadow-sm ring-1 ring-slate-200 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["all", ...STATUSES] as const).map((s) => {
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold capitalize transition ${
                    active
                      ? "bg-slate-900 text-white shadow"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                  }`}
                >
                  {s === "all" ? "All claims" : s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Claim cards */}
        <div className="mt-6 flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Recent claims</h2>
          <span className="text-xs font-bold text-indigo-600">{filtered.length} showing</span>
        </div>

        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="grid place-items-center rounded-3xl bg-white py-16 shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="rounded-3xl bg-white py-16 text-center text-sm text-slate-500 shadow-sm">No claims found.</p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`flex w-full items-center justify-between rounded-[2rem] border-l-[6px] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${STATUS_BORDER[c.status] ?? "border-slate-300"}`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${STATUS_PILL[c.status] ?? "bg-slate-100 text-slate-700"}`}>
                      {c.status}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-slate-400">#{c.claim_id}</span>
                  </div>
                  <h3 className="truncate text-sm font-bold text-slate-800">{c.full_name} · {c.insurance_company}</h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    {c.insurance_type} · {new Date(c.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="ml-4 shrink-0 text-right">
                  <p className="text-base font-extrabold text-slate-900">₹{Number(c.claim_amount).toLocaleString("en-IN")}</p>
                  <div className="mt-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Eye className="h-4 w-4" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </main>

      {selected && <ClaimDrawer claim={selected} onClose={() => setSelected(null)} onUpdate={updateStatus} />}
    </div>
  );
}

function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: React.ReactNode; color: string }) {
  return (
    <div className={`min-w-[140px] flex-none rounded-3xl p-4 text-white shadow-lg sm:min-w-0 ${color}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest opacity-90">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold leading-tight">{value}</div>
    </div>
  );
}

function ClaimDrawer({ claim, onClose, onUpdate }: { claim: Claim; onClose: () => void; onUpdate: (id: string, status: string) => void }) {
  const [viewer, setViewer] = useState<DocumentViewer | null>(null);
  const [openingPath, setOpeningPath] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (viewer?.url.startsWith("blob:")) URL.revokeObjectURL(viewer.url);
    };
  }, [viewer]);

  async function openDocument(path: string) {
    setOpeningPath(path);
    try {
      let url: string;
      if (/^https?:\/\//i.test(path)) {
        url = path;
      } else {
        const { data, error } = await supabase.storage
          .from("claim-documents")
          .createSignedUrl(path.replace(/^\/+/, ""), 300);
        if (error || !data?.signedUrl) throw new Error(error?.message || "Cannot sign URL");
        url = data.signedUrl;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Unable to download document (${res.status})`);
      const raw = await res.blob();
      const kind = getDocumentKind(path);
      const mime = kind === "pdf" ? "application/pdf" : raw.type || "application/octet-stream";
      const blob = new Blob([raw], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      setViewer((current) => {
        if (current?.url.startsWith("blob:")) URL.revokeObjectURL(current.url);
        return { path, url: blobUrl, blob, kind };
      });
    } catch (e: any) {
      toast.error(e?.message || "Unable to open document");
    } finally {
      setOpeningPath(null);
    }
  }

  function closeViewer() {
    if (viewer?.url.startsWith("blob:")) URL.revokeObjectURL(viewer.url);
    setViewer(null);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-xs text-muted-foreground">{claim.claim_id}</div>
            <h2 className="mt-1 font-serif text-2xl font-bold">{claim.full_name}</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-6 space-y-3 text-sm">
          <Row icon={<Mail className="h-4 w-4" />}><a href={`mailto:${claim.email}`} className="text-primary hover:underline">{claim.email}</a></Row>
          <Row icon={<Phone className="h-4 w-4" />}><a href={`tel:${claim.phone}`} className="text-primary hover:underline">{claim.phone}</a></Row>
          <Row icon={<MapPin className="h-4 w-4" />}>{claim.city}, {claim.state}</Row>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 text-sm">
          <Field label="Insurance type" value={claim.insurance_type} />
          <Field label="Insurer" value={claim.insurance_company} />
          <Field label="Policy #" value={claim.policy_number} />
          <Field label="Claim amount" value={`₹${Number(claim.claim_amount).toLocaleString("en-IN")}`} />
          <Field label="Rejection date" value={new Date(claim.rejection_date).toLocaleDateString("en-IN")} />
          <Field label="Status" value={claim.status} />
        </div>

        <div className="mt-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rejection reason</div>
          <p className="mt-1 rounded-lg border border-border bg-muted/30 p-3 text-sm">{claim.rejection_reason}</p>
        </div>

        <div className="mt-6">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Update status</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => onUpdate(claim.id, a.value)}
                disabled={claim.status === a.value}
                className={`rounded-md px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${a.className}`}
              >
                {a.label}
              </button>
            ))}
          </div>
          <select
            value={claim.status}
            onChange={(e) => onUpdate(claim.id, e.target.value)}
            className="mt-3 w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="mt-6">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Documents</div>
          {(claim.documents ?? []).length === 0 ? (
            <p className="mt-2 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">No documents uploaded.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {(claim.documents ?? []).map((path, i) => {
                const isOpening = openingPath === path;
                return (
                  <li key={`${path}-${i}`} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{getFileName(path)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openDocument(path)}
                      disabled={isOpening}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isOpening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                      View document
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {viewer && (
          <div className="fixed inset-0 z-[60] bg-black/70 p-4" onClick={closeViewer}>
            <div className="mx-auto flex h-full max-w-5xl flex-col rounded-xl bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">{getFileName(viewer.path)}</div>
                  <div className="text-xs text-muted-foreground">Secure local preview</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a href={viewer.url} target="_blank" rel="noreferrer" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Open document in new tab">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <a href={viewer.url} download className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Download document">
                    <Download className="h-4 w-4" />
                  </a>
                  <button onClick={closeViewer} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close document preview">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 bg-muted/30 p-3">
                {viewer.kind === "image" ? (
                  <img src={viewer.url} alt={getFileName(viewer.path)} className="mx-auto h-full max-h-full max-w-full rounded-lg object-contain" />
                ) : viewer.kind === "pdf" ? (
                  <PdfDocumentPreview blob={viewer.blob} fileName={getFileName(viewer.path)} />
                ) : (
                  <div className="grid h-full min-h-[50vh] place-items-center rounded-lg border border-border bg-card text-center">
                    <div>
                      <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                      <p className="mt-3 text-sm font-medium text-foreground">Preview is not available for this file type.</p>
                      <a href={viewer.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                        <ExternalLink className="h-4 w-4" /> Open document
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PdfDocumentPreview({ blob, fileName }: { blob: Blob; fileName: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let activeRenderTask: { cancel: () => void; promise: Promise<unknown> } | null = null;

    async function renderPdf() {
      setLoading(true);
      setError(null);

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

        const pdf = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;
        if (cancelled) return;

        setPageCount(pdf.numPages);
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const containerWidth = Math.min(canvas.parentElement?.clientWidth || 900, 1100);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.max(0.75, containerWidth / baseViewport.width);
        const viewport = page.getViewport({ scale });
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Unable to render PDF preview");

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        context.clearRect(0, 0, canvas.width, canvas.height);

        activeRenderTask = page.render({ canvas, canvasContext: context, viewport });
        await activeRenderTask.promise;
      } catch (e: any) {
        if (e?.name !== "RenderingCancelledException" && !cancelled) {
          setError(e?.message || "Chrome blocked the preview. Use download/open instead.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    renderPdf();

    return () => {
      cancelled = true;
      activeRenderTask?.cancel();
    };
  }, [blob, pageNumber]);

  return (
    <div className="flex h-full min-h-[70vh] flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <div className="min-w-0 truncate text-xs font-semibold text-muted-foreground">{fileName}</div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
            disabled={pageNumber <= 1 || loading}
            className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs font-medium text-muted-foreground">{pageNumber} / {pageCount}</span>
          <button
            type="button"
            onClick={() => setPageNumber((page) => Math.min(pageCount, page + 1))}
            disabled={pageNumber >= pageCount || loading}
            className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-auto bg-slate-100 p-3">
        {loading && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-background/70">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {error ? (
          <div className="grid min-h-[50vh] place-items-center text-center">
            <div>
              <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">{error}</p>
            </div>
          </div>
        ) : (
          <canvas ref={canvasRef} className="mx-auto block max-w-full bg-white shadow-sm" />
        )}
      </div>
    </div>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center gap-2 text-muted-foreground">{icon}<div>{children}</div></div>;
}
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium text-foreground">{value}</div>
    </div>
  );
}
