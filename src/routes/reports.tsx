import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Saved reports — Earnings IQ" },
      { name: "description", content: "Your exported earnings summaries and analysis history." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <AppShell>
      <div className="px-4 md:px-8 py-10 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold">Saved reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Exported summaries and historical analyses by quarter.
        </p>

        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
          <FileText className="h-6 w-6 mx-auto text-muted-foreground" />
          <div className="mt-3 font-medium">No reports yet</div>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Open a company dashboard and use “Export” to save a Markdown summary. Historical
            quarters will appear here once the analysis API is connected.
          </p>
          <Link
            to="/search"
            className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Search a ticker
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
