import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { ColorName } from "@/tokens/tokens";

const dotColors: Record<string, string> = {
  blue: "bg-blue",
  brightGreen: "bg-brightGreen",
  lightBlue: "bg-lightBlue",
  lightGreen: "bg-lightGreen",
  orange: "bg-orange",
  purple: "bg-purple",
};

export function DotSubheading({
  children,
  color = "blue",
  className,
}: {
  children: ReactNode;
  color?: ColorName;
  className?: string;
}) {
  const bars = [1, 2, 3, 4, 5];
  return (
    <div className={cn("mb-6", className)}>
      <div className="relative inline-flex items-center gap-2 rounded-l-full bg-lavenderGrey py-1.5 pl-2.5 pr-4 md:py-2 md:pl-3 md:pr-6">
        <div className={cn("h-2 w-2 shrink-0 rounded-full", dotColors[color] ?? "bg-blue")} />
        <span className="font-body text-[15px] text-navy">{children}</span>
        <div className="absolute inset-y-0 left-full ml-0 flex w-[1.375rem] items-stretch justify-between pl-[0.15rem]">
          {bars.map((index) => (
            <div
              key={index}
              className="h-full bg-lavenderGrey"
              style={{ width: 3.5 - 0.5 * index }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
