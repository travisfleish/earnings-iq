import { useEveAgent } from "eve/react";
import type { EveMessage, EveMessagePart } from "eve/react";
import { AlertCircle, Loader2, Send, Sparkles, Square } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { useStickToBottom } from "use-stick-to-bottom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function renderPart(part: EveMessagePart, key: string) {
  if (part.type === "text") {
    return (
      <div key={key} className="prose prose-sm dark:prose-invert max-w-none">
        <Streamdown>{part.text}</Streamdown>
      </div>
    );
  }

  if (part.type === "reasoning") {
    return (
      <details key={key} className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm">
        <summary className="cursor-pointer text-muted-foreground">Reasoning</summary>
        <div className="mt-2 text-muted-foreground">
          <Streamdown>{part.text}</Streamdown>
        </div>
      </details>
    );
  }

  if (part.type === "dynamic-tool") {
    return (
      <div
        key={key}
        className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
      >
        Tool: {part.toolName} ({part.state})
      </div>
    );
  }

  return null;
}

function MessageBubble({ message }: { message: EveMessage }) {
  const isUser = message.role === "user";
  const textParts = message.parts.filter((part) => part.type === "text" || part.type === "reasoning");

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-[color:var(--surface)] border border-border",
        )}
      >
        {!isUser && (
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Eve
          </div>
        )}
        <div className="space-y-2">
          {textParts.length > 0
            ? textParts.map((part, index) => renderPart(part, `${message.id}-${index}`))
            : message.parts.map((part, index) => renderPart(part, `${message.id}-${index}`))}
        </div>
      </div>
    </div>
  );
}

export function EveChat() {
  const { data, error, send, status, stop } = useEveAgent({ optimistic: true });
  const [input, setInput] = useState("");
  const { scrollRef, contentRef } = useStickToBottom();

  const isBusy = status === "submitted" || status === "streaming";
  const messages = data.messages;

  const placeholder = useMemo(
    () => "Ask about a ticker, earnings themes, sentiment, or how to use Earnings IQ…",
    [],
  );

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || isBusy) return;
    setInput("");
    await send({ message: text });
  }, [input, isBusy, send]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div ref={contentRef} className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-[color:var(--surface)] px-6 py-10 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-primary" />
              <h2 className="mt-4 text-lg font-semibold">Earnings intelligence chat</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask Eve about public companies, earnings calls, themes, and analyst sentiment.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isBusy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Eve is thinking…
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="border-t border-destructive/30 bg-destructive/5 px-4 py-3 md:px-8">
          <div className="mx-auto flex max-w-3xl items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error.message}</span>
          </div>
        </div>
      )}

      <div className="border-t border-border bg-background/95 px-4 py-4 backdrop-blur md:px-8">
        <form
          className="mx-auto flex max-w-3xl items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder={placeholder}
            rows={2}
            className="min-h-[52px] resize-none"
            disabled={isBusy}
          />
          {isBusy ? (
            <Button type="button" variant="outline" size="icon" onClick={() => stop()} aria-label="Stop">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
