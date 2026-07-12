import type { Metadata } from "next";
import { SavedReportsClient } from "./SavedReportsClient";

export const metadata: Metadata = {
  title: "Saved reports",
  description: "Your exported earnings summaries and analysis history.",
};

export default function ReportsPage() {
  return <SavedReportsClient />;
}
