import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Shield, Loader2, Megaphone, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/notices")({
  ssr: false,
  head: () => ({ meta: [{ title: "Notices — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminNotices,
});

type Notice = {
  id: string;
  title: string;
  body: string;
  type: string;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

const TYPE_STYLES: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  offer: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
};

const TYPE_BORDER: Record<string, string> = {
  info: "border-blue-400",
  offer: "border-emerald-500",
  warning: "border-amber-400",
};

function AdminNotices() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", type: "offer", expires_at: "" });

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/admin/login" });
        return;
      }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      if (!isAdmin) {
        toast.error("Admin access required");
        navigate({ to: "/admin/login" });
        return;
      }
      await load();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setNotices((data || []) as Notice[]);
  }

  async function createNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    setSaving(true);
    const payload: any = {
      title: form.title.trim(),
      body: form.body.trim(),
      type: form.type,
      active: true,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    const { error } = await supabase.from("notices").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Notice published");
    setForm({ title: "", body: "", type: "offer", expires_at: "" });
    await load();
  }

  async function toggleActive(n: Notice) {
    const { error } = await supabase.from("notices").update({ active: !n.active }).eq("id", n.id);
    if (error) return toast.error(error.message);
    toast.success(n.active ? "Notice hidden" : "Notice shown");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this notice permanently?")) return;
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    await load();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="sticky top-0 z-30 bg-indigo-600 text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link to="/admin" className="flex items-center" aria-label="Claim For Sure — by Sidheshwar Enterprises admin">
            <BrandLockup size="xs" layout="inline" tone="light" />
          </Link>
          <Link to="/admin" className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-5 py-6 sm:px-6">
        {/* Create */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400 text-slate-900">
              <Plus className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-800">Create notice / offer</h2>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            Notices are shown to all signed-in users on their dashboard until you hide them or they expire.
          </p>
          <form onSubmit={createNotice} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Diwali offer — 10% off claim service fee"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Body</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Submit a claim before 30 Nov and get 10% off the assistance fee. T&C apply."
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="offer">Offer</option>
                <option value="info">Information</option>
                <option value="warning">Important</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Expires at (optional)</label>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="mt-1 w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-md shadow-indigo-300/50 hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                Publish notice
              </button>
            </div>
          </form>
        </section>

        {/* List */}
        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">All notices</h2>
            <span className="text-xs font-bold text-indigo-600">{notices.length} total</span>
          </div>
          {notices.length === 0 ? (
            <p className="rounded-3xl bg-white py-16 text-center text-sm text-slate-500 shadow-sm">No notices yet.</p>
          ) : (
            <ul className="space-y-3">
              {notices.map((n) => {
                const expired = n.expires_at && new Date(n.expires_at) < new Date();
                return (
                  <li key={n.id} className={`flex items-start justify-between gap-4 rounded-[2rem] border-l-[6px] bg-white p-5 shadow-sm ${TYPE_BORDER[n.type] ?? "border-slate-300"}`}>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${TYPE_STYLES[n.type] || TYPE_STYLES.info}`}>
                          {n.type}
                        </span>
                        {!n.active && <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Hidden</span>}
                        {expired && <span className="rounded-lg bg-rose-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-700">Expired</span>}
                      </div>
                      <h3 className="mt-2 text-sm font-bold text-slate-800">{n.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                      <p className="mt-2 text-[11px] font-medium text-slate-400">
                        Created {new Date(n.created_at).toLocaleString()}
                        {n.expires_at && ` · Expires ${new Date(n.expires_at).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActive(n)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        title={n.active ? "Hide" : "Show"}
                      >
                        {n.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => remove(n.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
