import Link from "next/link";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function HomeButton({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-2 rounded-full text-sm font-heading text-muted-foreground hover:bg-lightGrey/60 hover:text-navy transition-colors duration-300 shrink-0",
        className,
      )}
      aria-label="Home"
    >
      <Home className="h-4 w-4" />
      <span>Home</span>
    </Link>
  );
}
