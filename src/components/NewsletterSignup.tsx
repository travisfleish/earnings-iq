"use client";

import { useRef, useState } from "react";
import { Mail } from "lucide-react";
import { BrandButton } from "@/components/brand/BrandButton";
import { subscribeNewsletter } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
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

          <form ref={formRef} onSubmit={onSubmit} className="mt-5 flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="flex-1 h-11 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-body text-white placeholder:text-white/50 outline-none focus:border-brightGreen focus:ring-2 focus:ring-brightGreen/20"
              disabled={status === "loading"}
            />
            <div
              className={cn(
                "shrink-0 self-start sm:self-auto",
                (status === "loading" || status === "ok") && "pointer-events-none opacity-60",
              )}
            >
              <BrandButton
                link={{
                  title: status === "ok" ? "Subscribed" : "Subscribe",
                  url: "#",
                }}
                button={{ type: "header", background_color: "lavenderGrey" }}
                onClick={() => formRef.current?.requestSubmit()}
              />
            </div>
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
