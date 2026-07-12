import type { ReactNode } from "react";
import { HomeButton } from "@/components/HomeButton";
import { cn } from "@/lib/utils";

export function PageHero({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <HomeButton className="absolute right-full top-0 mr-3 xl:mr-4 hidden lg:inline-flex whitespace-nowrap" />
      <HomeButton className="mb-4 lg:hidden" />
      {children}
    </div>
  );
}
