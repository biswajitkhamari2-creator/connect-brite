import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { AuthShell, btnPrimary } from "@/components/AuthCard";

export const Route = createFileRoute("/auth/verify")({
  component: VerifyPage,
  head: () => ({ meta: [{ title: "Verifying Email — ClaimForSure" }, { name: "robots", content: "noindex,nofollow" }] }),
});

function VerifyPage() {
  return (
    <AuthShell title="Email verified" subtitle="Your account is ready.">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-emerald-300/30 bg-emerald-300/10 p-4 text-sm text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Your account has been set up. Please log in to access your dashboard.</p>
        </div>
        <Link to="/auth/login" className={btnPrimary}>Go to login</Link>
      </div>
    </AuthShell>
  );
}