import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isLoggedIn } from "@/lib/phpAuth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    // Check for JWT token in localStorage — no network call needed here
    if (!isLoggedIn()) throw redirect({ to: "/auth/login" });
  },
  component: () => <Outlet />,
});
