import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { AuthShell, btnPrimary } from "@/components/AuthCard";
import { isLoggedIn } from "@/lib/phpAuth";

export const Route = createFileRoute("/auth/verified")({
  component: VerifiedPage,
  head: () => ({ meta: [{ title: "Email Verified — ClaimForSure" }, { name: "robots", content: "noindex,nofollow" }] }),
});

function VerifiedPage() {
  const signedIn = isLoggedIn();
  return (
    <AuthShell title="Email verified" subtitle="Your email has been verified successfully.">
      <div className="space-y-5 text-sm text-white/80">
        <div className="flex items-start gap-3 rounded-lg border border-emerald-300/30 bg-emerald-300/10 p-4 text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p>You can now sign in and submit claims through your dashboard.</p>
        </div>
        <Link to={signedIn ? "/dashboard" : "/auth/login"} className={btnPrimary}>
          {signedIn ? "Go to dashboard" : "Continue to login"}
        </Link>
      </div>
    </AuthShell>
  );
}
