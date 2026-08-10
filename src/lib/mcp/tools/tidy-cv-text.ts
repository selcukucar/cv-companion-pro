import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { formatCvText } from "../cv-analysis";

export default defineTool({
  name: "tidy_cv_text",
  title: "Tidy CV text",
  description:
    "Clean up CV/résumé text formatting: normalize bullet characters, collapse extra spaces and blank lines, fix punctuation spacing and prefix bare links with https://. Returns the cleaned text and a list of what changed.",
  inputSchema: {
    cv_text: z.string().describe("The CV/résumé text to tidy up."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ cv_text }) => {
    const result = formatCvText(cv_text);
    return {
      content: [
        { type: "text", text: result.text },
        { type: "text", text: "Yapılan düzenlemeler:\n" + result.changes.map((c) => `- ${c}`).join("\n") },
      ],
      structuredContent: result,
    };
  },
});
