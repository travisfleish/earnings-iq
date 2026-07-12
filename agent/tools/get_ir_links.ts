import { defineTool } from "eve/tools";
import { getIRLinks } from "@/lib/services/ir";

export default defineTool({
  description:
    "Get links to investor-relations resources for a ticker: earnings transcript search, webcast, presentation, press release, SEC filings, and IR homepage.",
  inputSchema: {
    type: "object",
    properties: {
      ticker: {
        type: "string",
        minLength: 1,
        maxLength: 10,
        description: "Stock ticker symbol",
      },
      companyName: {
        type: "string",
        maxLength: 200,
        description: "Company name for better search results",
      },
    },
    required: ["ticker"],
    additionalProperties: false,
  },
  async execute(input) {
    const ticker = String(input.ticker ?? "");
    const companyName =
      typeof input.companyName === "string" ? input.companyName : undefined;
    return {
      ticker: ticker.toUpperCase(),
      links: getIRLinks(ticker, companyName),
    };
  },
});
