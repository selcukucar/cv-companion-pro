import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { atsReport } from "../cv-analysis";

export default defineTool({
  name: "score_cv_ats",
  title: "Score CV for ATS",
  description:
    "Score a plain-text CV/résumé out of 100 for ATS (applicant tracking system) friendliness and return the failed checks with concrete improvement hints.",
  inputSchema: {
    cv_text: z.string().describe("The full CV/résumé as plain text."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ cv_text }) => {
    const report = atsReport(cv_text);
    const lines = [
      `ATS puanı: ${report.score}/100 — ${report.verdict}`,
      `Kelime sayısı: ${report.wordCount}`,
      "",
      ...report.checks.map((c) => `${c.passed ? "✅" : "❌"} ${c.label} (${c.points} puan)`),
    ];
    if (report.suggestions.length) {
      lines.push("", "Öneriler:", ...report.suggestions.map((s) => `- ${s}`));
    }
    return {
      content: [{ type: "text", text: lines.join("\n") }],
      structuredContent: report,
    };
  },
});
