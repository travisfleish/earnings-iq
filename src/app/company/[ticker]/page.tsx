import type { Metadata } from "next";
import { CompanyDashboard } from "@/components/company/CompanyDashboard";

type Props = {
  params: Promise<{ ticker: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params;
  const t = ticker.toUpperCase();
  return {
    title: `${t} — Earnings intelligence`,
    description: `Latest earnings analysis for ${t}: call summary, themes, bull/bear cases, analyst targets, and quarter-over-quarter changes.`,
    openGraph: {
      title: `${t} earnings intelligence — Earnings IQ`,
      description: `Executive-grade earnings dashboard for ${t}.`,
    },
  };
}

export default async function CompanyPage({ params }: Props) {
  const { ticker } = await params;
  return <CompanyDashboard ticker={ticker} />;
}
