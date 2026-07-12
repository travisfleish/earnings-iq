import type { ReactNode } from "react";
import { HomeButton } from "@/components/HomeButton";
import { cn } from "@/lib/utils";

export function PageHero({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className="mb-4 text-left">
        <HomeButton />
      </div>
      {children}
    </div>
  );
}
