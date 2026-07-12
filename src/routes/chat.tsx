import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EveChat } from "@/components/eve/EveChat";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Eve Chat — Earnings IQ" },
      {
        name: "description",
        content:
          "Chat with Eve, your earnings intelligence assistant. Ask about tickers, themes, sentiment, and analyst targets.",
      },
      { property: "og:title", content: "Eve Chat — Earnings IQ" },
      {
        property: "og:description",
        content: "AI earnings assistant powered by Vercel Eve and AI Gateway.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  return (
    <AppShell>
      <EveChat />
    </AppShell>
  );
}
