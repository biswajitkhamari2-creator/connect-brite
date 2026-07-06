import { createServerFn } from "@tanstack/react-start";

const ADMIN_EMAIL = "biswajitkhamari2@gmail.com";
const ADMIN_PASSWORD = "Biswa@12";

export const ensureAdminUser = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Find existing user by email
  let userId: string | null = null;
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw new Error(listErr.message);
  const existing = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);

  if (existing) {
    userId = existing.id;
    // Ensure password & confirmed
    await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
  } else {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Admin" },
    });
    if (createErr || !created.user) throw new Error(createErr?.message ?? "create failed");
    userId = created.user.id;
  }

  // Grant admin role (idempotent)
  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
  if (roleErr) throw new Error(roleErr.message);

  return { ok: true as const };
});