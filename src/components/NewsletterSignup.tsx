import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Check, Loader2 } from "lucide-react";
import { subscribeNewsletter } from "@/lib/newsletter.functions";
import { cn } from "@/lib/utils";

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setMsg(null);
    try {
      const res = await subscribe({ data: { email: email.trim() } });
      if (res.ok) {
        setStatus("ok");
        setMsg("You're on the list. Weekly earnings digest incoming.");
        setEmail("");
      } else {
        setStatus("err");
        setMsg(res.message ?? "Couldn't subscribe — try again.");
      }
    } catch {
      setStatus("err");
      setMsg("Couldn't subscribe — check the email and try again.");
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card",
        compact ? "p-5" : "p-6 md:p-8",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
          <Mail className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="flex-1">
          <div className={cn("font-semibold", compact ? "text-base" : "text-lg")}>
            Get the weekly Earnings IQ digest
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            One email a week with concise summaries of the biggest earnings reports —
            scorecards, guidance tone, and what to watch next.
          </p>

          <form onSubmit={onSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="flex-1 h-11 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/60"
              disabled={status === "loading"}
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "ok"}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "ok" && <Check className="h-4 w-4" />}
              {status === "ok" ? "Subscribed" : "Subscribe"}
            </button>
          </form>

          {msg && (
            <div
              className={cn(
                "mt-3 text-xs",
                status === "ok" ? "text-[color:var(--bull)]" : "text-[color:var(--bear)]",
              )}
            >
              {msg}
            </div>
          )}
          <div className="mt-3 text-[11px] text-muted-foreground">
            No spam. Unsubscribe anytime.
          </div>
        </div>
      </div>
    </div>
  );
}
