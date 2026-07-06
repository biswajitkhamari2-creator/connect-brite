import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Tag, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/promocodes")({
  ssr: false,
  head: () => ({ meta: [{ title: "Promo Codes — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: PromoCodesAdmin,
});

type PromoCode = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "flat";
  discount_value: number;
  active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  times_used: number;
  created_at: string;
};

function PromoCodesAdmin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [discountValue, setDiscountValue] = useState("10");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/admin/login" }); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) { navigate({ to: "/admin/login" }); return; }
      setChecking(false);
      fetchRows();
    })();
  }, [navigate]);

  async function fetchRows() {
    setLoading(true);
    const { data, error } = await supabase
      .from("promo_codes" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as any) || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return toast.error("Enter a code");
    const value = parseInt(discountValue);
    if (!value || value <= 0) return toast.error("Enter a valid discount value");
    if (discountType === "percent" && value > 100) return toast.error("Percent must be 1-100");
    setSaving(true);
    const payload: any = {
      code: code.trim().toUpperCase(),
      description: description.trim() || null,
      discount_type: discountType,
      discount_value: discountType === "flat" ? value * 100 : value, // flat stored in paise
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      max_uses: maxUses ? parseInt(maxUses) : null,
    };
    const { error } = await supabase.from("promo_codes" as any).insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Promo code created");
    setCode(""); setDescription(""); setDiscountValue("10"); setExpiresAt(""); setMaxUses("");
    fetchRows();
  }

  async function toggleActive(row: PromoCode) {
    const { error } = await supabase.from("promo_codes" as any).update({ active: !row.active }).eq("id", row.id);
    if (error) return toast.error(error.message);
    fetchRows();
  }

  async function remove(id: string) {
    if (!confirm("Delete this promo code?")) return;
    const { error } = await supabase.from("promo_codes" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    fetchRows();
  }

  if (checking) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-500 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Tag className="h-6 w-6" />
            <div>
              <h1 className="font-display text-lg font-extrabold sm:text-xl">Promo Codes</h1>
              <p className="text-xs text-white/80">Create discount coupons customers can apply at payment</p>
            </div>
          </div>
          <Link to="/admin" className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-bold text-slate-900">Create a new coupon</h2>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-6">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SAVE10" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Diwali offer" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Type</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="percent">Percent %</option>
                <option value="flat">Flat ₹</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                {discountType === "percent" ? "Percent (1-100)" : "Amount (₹)"}
              </label>
              <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Expires at (optional)</label>
              <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Max uses (optional)</label>
              <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Unlimited" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Create</>}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="font-display text-lg font-bold text-slate-900">All coupons</h2>
            <span className="text-xs text-slate-500">{rows.length} total</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">No promo codes yet. Create one above.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left">Discount</th>
                    <th className="px-4 py-3 text-left">Expires</th>
                    <th className="px-4 py-3 text-left">Uses</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700">{r.code}</td>
                      <td className="px-4 py-3 text-slate-600">{r.description || "—"}</td>
                      <td className="px-4 py-3">
                        {r.discount_type === "percent" ? `${r.discount_value}%` : `₹${(r.discount_value / 100).toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.expires_at ? new Date(r.expires_at).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3">{r.times_used}{r.max_uses ? ` / ${r.max_uses}` : ""}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(r)} className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${r.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                          {r.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => remove(r.id)} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}