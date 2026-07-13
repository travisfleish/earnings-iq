"use client";

import { useEveAgent } from "eve/react";
import type { EveDynamicToolPart, EveMessage, EveMessageInputRequest, EveMessagePart } from "eve/react";
import { AlertCircle, Loader2, Send, Sparkles, Square } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { useStickToBottom } from "use-stick-to-bottom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type PendingInput = {
  part: EveDynamicToolPart;
  request: EveMessageInputRequest;
};

function formatAgentError(message: string): string {
  if (/Free tier requests|OIDC.*rate.?limit|free monthly pool/i.test(message)) {
    return "GeniusAI hit Vercel AI Gateway free-tier limits. Set AI_GATEWAY_API_KEY in .env.local (or VERCEL_AI_API_KEY in .env), restart npm run dev, then start a new chat.";
  }
  if (/rate.?limit|429|GatewayRateLimitError|rate_limit_exceeded/i.test(message)) {
    return "GeniusAI hit an AI Gateway rate limit. Wait a moment and try again, or start a new chat. If this keeps happening, check AI Gateway usage in the Vercel dashboard.";
  }
  if (/AI Gateway authentication|Invalid API key|Invalid OIDC/i.test(message)) {
    return "GeniusAI could not authenticate with Vercel AI Gateway. Run `vercel env pull .env.local` or set AI_GATEWAY_API_KEY, then restart `npm run dev`.";
  }
  return message;
}

function findLatestTurnError(events: readonly { type: string; data?: unknown }[]): string | null {
  let lastTurnCompletedIndex = -1;
  let lastFailure: { index: number; message: string } | null = null;

  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    if (event?.type === "turn.completed") {
      lastTurnCompletedIndex = i;
      continue;
    }
    if (event?.type !== "turn.failed" && event?.type !== "session.failed") continue;

    const message =
      typeof event.data === "object" &&
      event.data !== null &&
      "message" in event.data &&
      typeof (event.data as { message?: unknown }).message === "string"
        ? (event.data as { message: string }).message
        : "Unknown error";
    lastFailure = { index: i, message };
  }

  if (!lastFailure || lastTurnCompletedIndex > lastFailure.index) return null;
  return formatAgentError(lastFailure.message);
}

function findPendingInput(messages: readonly EveMessage[]): PendingInput | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role !== "assistant") continue;

    for (const part of message.parts) {
      if (part.type !== "dynamic-tool" || part.state !== "approval-requested") continue;
      const request = part.toolMetadata?.eve?.inputRequest;
      if (request) return { part, request };
    }
  }
  return null;
}

function renderPart(part: EveMessagePart, key: string, isAnimating: boolean) {
  if (part.type === "text") {
    const streaming = isAnimating && part.state === "streaming";
    return (
      <div key={key} className="prose prose-sm dark:prose-invert max-w-none">
        <Streamdown animated={{ sep: "word" }} isAnimating={streaming}>
          {part.text}
        </Streamdown>
      </div>
    );
  }

  if (part.type === "reasoning") {
    const streaming = isAnimating && part.state === "streaming";
    return (
      <details key={key} className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm">
        <summary className="cursor-pointer text-muted-foreground">Reasoning</summary>
        <div className="mt-2 text-muted-foreground">
          <Streamdown animated={{ sep: "word" }} isAnimating={streaming}>
            {part.text}
          </Streamdown>
        </div>
      </details>
    );
  }

  if (part.type === "dynamic-tool") {
    if (part.state === "approval-requested") return null;

    if (part.state === "output-available" || part.state === "output-denied" || part.state === "output-error") {
      return null;
    }

    return (
      <div
        key={key}
        className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
      >
        Running {part.toolName}…
      </div>
    );
  }

  if (part.type === "authorization") {
    return (
      <div key={key} className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
        {part.state === "completed" ? (
          <span>{part.displayName} authorization {part.outcome}.</span>
        ) : (
          <>
            <p className="font-medium">{part.displayName}</p>
            <p className="mt-1 text-muted-foreground">{part.description}</p>
            {part.authorization?.url && (
              <a
                href={part.authorization.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-primary underline"
              >
                Connect {part.displayName}
              </a>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
}

function assistantHasVisibleText(messages: readonly EveMessage[]): boolean {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role !== "assistant") continue;
    return message.parts.some(
      (part) => (part.type === "text" || part.type === "reasoning") && part.text.length > 0,
    );
  }
  return false;
}

function MessageBubble({ message, isAnimating }: { message: EveMessage; isAnimating: boolean }) {
  const isUser = message.role === "user";
  const visibleParts = message.parts
    .map((part, index) => renderPart(part, `${message.id}-${index}`, isAnimating))
    .filter(Boolean);

  if (visibleParts.length === 0 && !isUser) return null;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-blue text-white"
            : "bg-lightGrey border border-lavenderGrey text-navy",
        )}
      >
        {!isUser && (
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            GeniusAI
          </div>
        )}
        <div className="space-y-2">{visibleParts}</div>
      </div>
    </div>
  );
}

function HitlPrompt({
  pending,
  onRespond,
  disabled,
}: {
  pending: PendingInput;
  onRespond: (response: { optionId?: string; text?: string }) => Promise<void>;
  disabled: boolean;
}) {
  const { request, part } = pending;
  const [freeform, setFreeform] = useState("");
  const isConfirmation = request.display === "confirmation" || part.toolName !== "ask_question";
  const options =
    request.options ??
    (isConfirmation
      ? [
          { id: "approve", label: "Approve", style: "primary" as const },
          { id: "deny", label: "Deny", style: "default" as const },
        ]
      : []);

  const showTextInput =
    request.display === "text" || request.allowFreeform || (part.toolName === "ask_question" && options.length === 0);

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-primary/30 bg-primary/5 px-4 py-4">
      <p className="text-sm font-medium text-foreground">{request.prompt}</p>
      {options.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {options.map((option) => (
            <Button
              key={option.id}
              type="button"
              size="sm"
              variant={option.style === "primary" ? "default" : option.style === "danger" ? "destructive" : "outline"}
              disabled={disabled}
              onClick={() => void onRespond({ optionId: option.id })}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}
      {showTextInput && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const text = freeform.trim();
            if (!text || disabled) return;
            setFreeform("");
            void onRespond({ text });
          }}
        >
          <Textarea
            value={freeform}
            onChange={(event) => setFreeform(event.target.value)}
            placeholder="Type your answer…"
            rows={2}
            className="min-h-[44px] resize-none"
            disabled={disabled}
          />
          <Button type="submit" size="icon" disabled={disabled || !freeform.trim()} aria-label="Submit answer">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}

export function EveChat({ variant = "page" }: { variant?: "page" | "hero" }) {
  const isHero = variant === "hero";
  const { data, error, events, reset, send, status, stop } = useEveAgent({ optimistic: true });
  const [input, setInput] = useState("");
  const { scrollRef, contentRef } = useStickToBottom();

  const isBusy = status === "submitted" || status === "streaming";
  const messages = data.messages;
  const pendingInput = useMemo(() => findPendingInput(messages), [messages]);
  const turnError = useMemo(() => findLatestTurnError(events), [events]);
  const displayError = error?.message ?? turnError;
  const showThinking = isBusy && !pendingInput && !assistantHasVisibleText(messages);

  const placeholder = useMemo(
    () =>
      isHero
        ? "Ask GeniusAI about a ticker, themes, or sentiment…"
        : "Ask about a ticker, earnings themes, sentiment, or how to use Earnings IQ…",
    [isHero],
  );

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || isBusy) return;
    setInput("");
    await send({ message: text });
  }, [input, isBusy, send]);

  const handleHitlRespond = useCallback(
    async (response: { optionId?: string; text?: string }) => {
      if (!pendingInput || isBusy) return;
      await send({
        inputResponses: [
          {
            requestId: pendingInput.request.requestId,
            ...response,
          },
        ],
      });
    },
    [isBusy, pendingInput, send],
  );

  return (
    <div
      className={cn(
        "flex flex-col",
        isHero
          ? "h-[min(520px,calc(100vh-10rem))] rounded-2xl border border-lavenderGrey bg-white shadow-sm overflow-hidden"
          : "h-[calc(100vh-4rem)]",
      )}
    >
      <div
        ref={scrollRef}
        className={cn("flex-1 overflow-y-auto", isHero ? "px-4 py-4" : "px-4 py-6 md:px-8")}
      >
        <div ref={contentRef} className={cn("flex flex-col gap-3", !isHero && "mx-auto max-w-3xl")}>
          {messages.length === 0 && (
            <div
              className={cn(
                "text-center",
                isHero
                  ? "rounded-xl border border-dashed border-lavenderGrey bg-lightGrey/50 px-4 py-8"
                  : "rounded-2xl border border-dashed border-lavenderGrey bg-lightGrey px-6 py-10",
              )}
            >
              <Sparkles className={cn("mx-auto text-blue", isHero ? "h-6 w-6" : "h-8 w-8")} />
              <h2 className={cn("mt-3 font-heading font-light tracking-tight", isHero ? "text-base" : "text-lg")}>
                {isHero ? "Chat with GeniusAI" : "Earnings intelligence chat"}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {isHero
                  ? "Your earnings assistant — ask about tickers, themes, and analyst sentiment."
                  : "Ask GeniusAI about public companies, earnings calls, themes, and analyst sentiment."}
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isAnimating={
                status === "streaming" &&
                index === messages.length - 1 &&
                message.role === "assistant"
              }
            />
          ))}

          {showThinking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              GeniusAI is thinking…
            </div>
          )}
        </div>
      </div>

      {displayError && (
        <div
          className={cn(
            "border-t border-destructive/30 bg-destructive/5",
            isHero ? "px-4 py-2" : "px-4 py-3 md:px-8",
          )}
        >
          <div className={cn("flex items-start gap-2 text-sm text-destructive", !isHero && "mx-auto max-w-3xl")}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-2">
              <p>{displayError}</p>
              <Button type="button" size="sm" variant="outline" onClick={() => reset()}>
                Start new chat
              </Button>
            </div>
          </div>
        </div>
      )}

      {pendingInput && (
        <div className={cn("border-t border-border bg-background/95 backdrop-blur", isHero ? "px-4 py-3" : "px-4 py-4 md:px-8")}>
          <HitlPrompt pending={pendingInput} onRespond={handleHitlRespond} disabled={isBusy} />
        </div>
      )}

      <div className={cn("border-t border-border bg-background/95 backdrop-blur", isHero ? "px-4 py-3" : "px-4 py-4 md:px-8")}>
        <form
          className={cn("flex items-end gap-2", !isHero && "mx-auto max-w-3xl")}
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
            placeholder={pendingInput ? "Answer GeniusAI’s question above, or send a new message…" : placeholder}
            rows={isHero ? 1 : 2}
            className={cn("resize-none", isHero ? "min-h-[44px]" : "min-h-[52px]")}
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
