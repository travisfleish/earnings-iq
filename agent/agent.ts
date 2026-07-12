import { defineAgent } from "eve";

export default defineAgent({
  model: process.env.AI_SCORECARD_MODEL ?? "google/gemini-2.5-flash",
});
