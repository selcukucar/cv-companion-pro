import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { matchJobPosting } from "../cv-analysis";

export default defineTool({
  name: "match_cv_to_job",
  title: "Match CV to job posting",
  description:
    "Compare a plain-text CV against a job posting and report keyword coverage: match percentage, matched keywords and missing keywords worth addressing.",
  inputSchema: {
    cv_text: z.string().describe("The full CV/résumé as plain text."),
    job_posting: z.string().describe("The job posting / vacancy text to compare against."),
    keyword_limit: z
      .number()
      .int()
      .describe("How many of the posting's top keywords to compare. Sensible range 10-60, default 30.")
      .optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ cv_text, job_posting, keyword_limit }) => {
    const limit = Math.min(60, Math.max(5, keyword_limit ?? 30));
    const result = matchJobPosting(cv_text, job_posting, limit);
    const text = [
      `Eşleşme: %${result.matchPercent} (${result.matched.length}/${result.keywordCount} anahtar kelime)`,
      "",
      `Eşleşen: ${result.matched.join(", ") || "yok"}`,
      `Eksik: ${result.missing.join(", ") || "yok"}`,
      "",
      result.advice,
    ].join("\n");
    return { content: [{ type: "text", text }], structuredContent: result };
  },
});
