import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Earnings IQ — Instant earnings intelligence for any ticker",
    template: "%s · Earnings IQ",
  },
  description:
    "Enter any public-company ticker and get an executive-grade earnings dashboard: call summary, themes, analyst sentiment, price targets, and quarter-over-quarter changes.",
  openGraph: {
    title: "Earnings IQ — Instant earnings intelligence",
    description:
      "Executive-grade earnings dashboards for any public company. Themes, sentiment, analyst targets, and quarter-over-quarter comparison.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
