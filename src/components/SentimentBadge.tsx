import { cn } from "@/lib/utils";
import type { Sentiment } from "@/lib/types";

export function SentimentBadge({
  sentiment,
  className,
  label,
}: {
  sentiment: Sentiment;
  className?: string;
  label?: string;
}) {
  const styles: Record<Sentiment, string> = {
    positive: "bg-[color:var(--bull)]/15 text-[color:var(--bull)] border-[color:var(--bull)]/30",
    negative: "bg-[color:var(--bear)]/15 text-[color:var(--bear)] border-[color:var(--bear)]/30",
    neutral: "bg-[color:var(--neutral)]/15 text-[color:var(--neutral)] border-[color:var(--neutral)]/30",
  };
  const defaultLabel: Record<Sentiment, string> = {
    positive: "Positive",
    negative: "Negative",
    neutral: "Neutral",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
        styles[sentiment],
        className,
      )}
    >
      {label ?? defaultLabel[sentiment]}
    </span>
  );
}

export function PriceDelta({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const positive = value > 0;
  const negative = value < 0;
  return (
    <span
      className={cn(
        "tabular font-medium",
        positive && "text-[color:var(--bull)]",
        negative && "text-[color:var(--bear)]",
        !positive && !negative && "text-muted-foreground",
      )}
    >
      {positive ? "+" : ""}
      {value.toFixed(2)}
      {suffix}
    </span>
  );
}
