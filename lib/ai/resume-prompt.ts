/** Maximum characters of resume text sent to the model. ~1 500 tokens. */
const MAX_TEXT_CHARS = 6000;

/**
 * System prompt: instructs the model to act as a professional resume analyst
 * and return strict JSON matching the AIAnalysisResponseSchema.
 */
export function buildSystemPrompt(): string {
  return `You are an expert resume analyst and career coach. Your task is to analyze a resume and return a structured JSON object with actionable, honest feedback.

You MUST return ONLY valid JSON — no markdown, no prose, no code fences. The JSON must match this exact structure:

{
  "overallScore": <integer 0-100>,
  "potentialScore": <integer 0-100, score if top fixes applied>,
  "grade": <string: "A", "A-", "B+", "B", "B-", "C+", "C", "D", "F">,
  "betterThanPercent": <integer 0-100>,
  "interviewChancePercent": <integer 0-100>,
  "aiSummary": <string max 300 words>,
  "scoreData": {
    "ats": <0-100>, "keywordMatch": <0-100>, "experienceQuality": <0-100>,
    "formatting": <0-100>, "skillsCoverage": <0-100>,
    "grammarClarity": <0-100>, "interviewReadiness": <0-100>
  },
  "issuesData": [
    { "id": "f1", "priority": "critical"|"important"|"optional",
      "title": <string>, "explanation": <string>, "scoreGain": <0-20>,
      "effort": "5 min"|"15 min"|"30 min"|"1 hour" }
  ],
  "recommendationsData": [
    { "id": "r1", "title": <string>, "scoreGain": <0-20>,
      "reason": <string>, "preview": <string> }
  ],
  "keywordsData": {
    "matched": [{ "label": <string>, "impact": "high"|"medium"|"low" }],
    "missing": [{ "label": <string>, "impact": "high"|"medium"|"low" }],
    "suggested": [{ "label": <string>, "impact": "high"|"medium"|"low" }]
  },
  "sectionsData": [
    { "id": <string>, "title": <string>, "score": <0-100>,
      "strengths": [<string>], "weaknesses": [<string>], "suggestion": <string> }
  ],
  "actionPlanData": [
    { "step": <integer>, "title": <string>, "description": <string>, "scoreGain": <0-20> }
  ]
}

Rules:
- Be specific and actionable. Vague feedback is not acceptable.
- issuesData: 3–6 items ordered by priority (critical first).
- recommendationsData: 2–4 items with concrete rewrite previews.
- keywordsData.matched: keywords found in the resume; missing: important keywords absent; suggested: additional keywords that would strengthen it.
- sectionsData: analyse each section present in the resume (summary, experience, education, skills, projects, certifications as applicable).
- actionPlanData: 3–5 steps ordered by impact.
- Scores must be internally consistent (overallScore ≈ weighted average of scoreData values).`;
}

/**
 * User prompt: resume text + optional target job title.
 * Text is truncated to MAX_TEXT_CHARS to control token cost.
 */
export function buildUserPrompt(
  extractedText: string,
  targetJobTitle?: string | null
): string {
  const truncated = extractedText.length > MAX_TEXT_CHARS
    ? extractedText.slice(0, MAX_TEXT_CHARS) + "\n\n[... text truncated for brevity ...]"
    : extractedText;

  const jobContext = targetJobTitle
    ? `\nTarget job title: ${targetJobTitle}\n`
    : "";

  return `Please analyse the following resume and return the JSON analysis object.${jobContext}
--- RESUME START ---
${truncated}
--- RESUME END ---`;
}
