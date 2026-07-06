import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { LogOut, FilePlus2, FileText, User, LayoutDashboard, Home, Gift, Receipt, ShieldAlert } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandLockup } from "@/components/BrandLockup";

export function DashboardShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const router = useRouter();
  const [isDefaulter, setIsDefaulter] = useState(false);
  const [outstanding, setOutstanding] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("is_defaulter").eq("user_id", user.id).maybeSingle();
      if (prof?.is_defaulter) {
        setIsDefaulter(true);
        const { data: d } = await supabase.from("defaulters").select("total_outstanding_paise").eq("user_id", user.id).maybeSingle();
        setOutstanding(d?.total_outstanding_paise ?? 0);
      }
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.invalidate();
    navigate({ to: "/auth/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center" aria-label="Claim For Sure — by Sidheshwar Enterprises">
            <BrandLockup size="sm" layout="inline" />
          </Link>
          <nav className="hidden gap-5 text-sm text-muted-foreground md:flex">
            <Link to="/dashboard" className="hover:text-foreground inline-flex items-center gap-1.5"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
            <Link to="/dashboard/claims" className="hover:text-foreground inline-flex items-center gap-1.5"><FileText className="h-4 w-4" /> My Claims</Link>
            <Link to="/dashboard/invoices" className="hover:text-foreground inline-flex items-center gap-1.5"><Receipt className="h-4 w-4" /> Invoices</Link>
            <Link to="/dashboard/profile" className="hover:text-foreground inline-flex items-center gap-1.5"><User className="h-4 w-4" /> Profile</Link>
            <Link to="/dashboard/rewards" className="hover:text-foreground inline-flex items-center gap-1.5"><Gift className="h-4 w-4" /> Rewards</Link>
            <Link to="/" className="hover:text-foreground inline-flex items-center gap-1.5"><Home className="h-4 w-4" /> Site</Link>
          </nav>
          <div className="flex items-center gap-2">
            {!isDefaulter && <Link to="/dashboard/claims/new" className="hidden md:inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
              <FilePlus2 className="h-4 w-4" /> New Claim
            </Link>}
            <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>
      {isDefaulter && (
        <div className="border-b border-rose-200 bg-rose-50">
          <div className="mx-auto flex max-w-6xl items-start gap-3 px-6 py-3 text-sm text-rose-800">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <strong>Account flagged:</strong> You have ₹{(outstanding / 100).toLocaleString("en-IN")} in overdue success-fee invoices. New claims are blocked until you settle.
            </div>
            <Link to="/dashboard/invoices" className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700">Pay now</Link>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
