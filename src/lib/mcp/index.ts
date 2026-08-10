import { defineMcp } from "@lovable.dev/mcp-js";

import matchCvToJobTool from "./tools/match-cv-to-job";
import scoreCvAtsTool from "./tools/score-cv-ats";
import tidyCvTextTool from "./tools/tidy-cv-text";

export default defineMcp({
  name: "cv-companion-pro",
  title: "CV Companion Pro",
  version: "0.1.0",
  instructions:
    "CV/résumé analysis tools. Use `score_cv_ats` to grade a CV's ATS friendliness, `match_cv_to_job` to compare a CV against a job posting's keywords, and `tidy_cv_text` to clean up CV text formatting. All tools are stateless: they only analyze the text passed in and store nothing.",
  tools: [scoreCvAtsTool, matchCvToJobTool, tidyCvTextTool],
});
