import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare companies",
  description: "Compare price, analyst targets, and earnings sentiment across companies.",
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
