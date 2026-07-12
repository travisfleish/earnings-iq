import { defineTool } from "eve/tools";
import { getLiveQuoteForTicker } from "@/lib/getLiveQuote";

export default defineTool({
  description:
    "Get the current live stock price and daily change for a ticker symbol. Use this for any question about current price, market state, or today's move.",
  inputSchema: {
    type: "object",
    properties: {
      ticker: {
        type: "string",
        minLength: 1,
        maxLength: 10,
        description: "Stock ticker symbol, e.g. AAPL or NVDA",
      },
    },
    required: ["ticker"],
    additionalProperties: false,
  },
  async execute(input) {
    const ticker = String(input.ticker ?? "");
    const quote = await getLiveQuoteForTicker(ticker);
    if (!quote) {
      return {
        found: false as const,
        ticker: ticker.toUpperCase(),
        message: "No live quote found for this ticker.",
      };
    }
    return { found: true as const, ...quote };
  },
});
