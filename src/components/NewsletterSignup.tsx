"use client";

import { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";
import { subscribeNewsletter } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setMsg(null);
    try {
      const res = await subscribeNewsletter({ email: email.trim() });
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
        "relative overflow-hidden rounded-2xl bg-blue text-white",
        compact ? "p-5" : "p-6 md:p-8",
      )}
    >
      {/* Decorative spring lines */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 flex w-16 rotate-45 translate-x-8 opacity-20">
        {[8, 6, 4, 2].map((w, i) => (
          <div key={i} className="h-full bg-white mx-0.5" style={{ width: w }} />
        ))}
      </div>

      <div className="relative flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-white/15 grid place-items-center shrink-0">
          <Mail className="h-5 w-5 text-brightGreen" />
        </div>
        <div className="flex-1">
          <div className={cn("font-heading font-light tracking-tight", compact ? "text-lg" : "text-xl")}>
            Get the weekly Earnings IQ digest
          </div>
          <p className="font-body text-sm text-white/80 mt-1.5 leading-relaxed">
            One email a week with concise summaries of the biggest earnings reports —
            scorecards, guidance tone, and what to watch next.
          </p>

          <form onSubmit={onSubmit} className="mt-5 flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="flex-1 h-11 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-body text-white placeholder:text-white/50 outline-none focus:border-brightGreen focus:ring-2 focus:ring-brightGreen/20"
              disabled={status === "loading"}
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "ok"}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-white text-navy text-sm font-medium font-body hover:bg-brightGreen transition-colors duration-300 disabled:opacity-60"
            >
              {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "ok" && <Check className="h-4 w-4" />}
              {status === "ok" ? "Subscribed" : "Subscribe"}
            </button>
          </form>

          {msg && (
            <div
              className={cn(
                "mt-3 text-xs font-body",
                status === "ok" ? "text-brightGreen" : "text-lightRed",
              )}
            >
              {msg}
            </div>
          )}
          <div className="mt-3 text-[11px] font-body text-white/50">
            No spam. Unsubscribe anytime.
          </div>
        </div>
      </div>
    </div>
  );
}
