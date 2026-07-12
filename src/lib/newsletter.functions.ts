import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const InputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Backend not configured");

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: data.email });

    // Unique violation = already subscribed. Treat as success (idempotent).
    if (error && error.code !== "23505") {
      return { ok: false as const, message: error.message };
    }
    return { ok: true as const };
  });
