import { createServerFn } from "@tanstack/react-start";

const CUSTOMER_EMAIL = "demo@claimforsure.test";
const CUSTOMER_PASSWORD = "Demo@Customer2026";

export const ensureDemoCustomer = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw new Error(listErr.message);
  const existing = list.users.find((u) => u.email?.toLowerCase() === CUSTOMER_EMAIL);

  if (existing) {
    await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password: CUSTOMER_PASSWORD,
      email_confirm: true,
    });
  } else {
    const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: CUSTOMER_EMAIL,
      password: CUSTOMER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Demo Customer", phone: "9000000001" },
    });
    if (createErr) throw new Error(createErr.message);
  }

  return { ok: true as const, email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD };
});