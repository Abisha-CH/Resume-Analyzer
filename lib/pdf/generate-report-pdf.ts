/**
 * lib/pdf/generate-report-pdf.ts
 *
 * Client-side PDF generation for the ResuMind analysis report.
 * Uses jsPDF — no backend required.
 */
import type { AnalysisResult, ScoreData } from "@/lib/types/resume";
import { scoreDataToMetrics } from "@/lib/types/resume";

// ── Layout constants ──────────────────────────────────────────────────────────
const PAGE_W = 210;  // A4 mm
const PAGE_H = 297;
const ML = 15;       // margin left
const MR = 15;       // margin right
const CONTENT_W = PAGE_W - ML - MR;
const MT = 15;       // margin top
const MB = 15;       // margin bottom

// Colours (RGB)
const C_PRIMARY:   [number,number,number] = [99, 102, 241];  // indigo-500
const C_SUCCESS:   [number,number,number] = [34, 197, 94];
const C_DARK:      [number,number,number] = [15, 23, 42];
const C_MUTED:     [number,number,number] = [100, 116, 139];
const C_BORDER:    [number,number,number] = [226, 232, 240];
const C_BG:        [number,number,number] = [248, 250, 252];
const C_YELLOW:    [number,number,number] = [234, 179, 8];
const C_RED:       [number,number,number] = [239, 68, 68];
const C_WHITE:     [number,number,number] = [255, 255, 255];

// ── Helper class that wraps jsPDF with a cursor ───────────────────────────────
class Doc {
  private pdf: import("jspdf").jsPDF;
  y: number;

  constructor(pdf: import("jspdf").jsPDF) {
    this.pdf = pdf;
    this.y = MT;
  }

  /** Ensure there's `needed` mm left on the page; add new page if not. */
  ensureSpace(needed: number) {
    if (this.y + needed > PAGE_H - MB) {
      this.pdf.addPage();
      this.y = MT;
    }
  }

  /** Draw a filled rectangle. */
  rect(x: number, y: number, w: number, h: number, color: [number,number,number]) {
    this.pdf.setFillColor(...color);
    this.pdf.rect(x, y, w, h, "F");
  }

  /** Draw a stroked rectangle. */
  rectStroke(x: number, y: number, w: number, h: number, color: [number,number,number]) {
    this.pdf.setDrawColor(...color);
    this.pdf.rect(x, y, w, h, "S");
  }

  /** Wrapping text. Returns final y after writing. */
  text(
    txt: string,
    x: number,
    size: number,
    color: [number,number,number],
    style: "normal"|"bold" = "normal",
    maxW = CONTENT_W,
    align: "left"|"center" = "left",
  ): number {
    this.pdf.setFontSize(size);
    this.pdf.setFont("helvetica", style);
    this.pdf.setTextColor(...color);
    const lines = this.pdf.splitTextToSize(txt, maxW) as string[];
    const lineH = size * 0.4;
    this.ensureSpace(lines.length * lineH + 2);
    this.pdf.text(lines, x, this.y, { align });
    this.y += lines.length * lineH + 1;
    return this.y;
  }

  gap(mm: number) { this.y += mm; }

  /** Horizontal rule */
  hr(color: [number,number,number] = C_BORDER) {
    this.pdf.setDrawColor(...color);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(ML, this.y, PAGE_W - MR, this.y);
    this.y += 3;
  }

  /** Section heading with coloured left bar */
  sectionHeading(title: string) {
    this.ensureSpace(12);
    this.rect(ML, this.y - 1, 2, 7, C_PRIMARY);
    this.pdf.setFontSize(11);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(...C_DARK);
    this.pdf.text(title, ML + 4, this.y + 4.5);
    this.y += 9;
  }

  get raw() { return this.pdf; }
}

// ── Section builders ──────────────────────────────────────────────────────────

function drawHeader(doc: Doc, filename: string, grade: string | null) {
  // Brand bar
  doc.rect(0, 0, PAGE_W, 18, C_PRIMARY);
  doc.raw.setFontSize(13);
  doc.raw.setFont("helvetica", "bold");
  doc.raw.setTextColor(...C_WHITE);
  doc.raw.text("ResuMind", ML, 11);
  doc.raw.setFontSize(8);
  doc.raw.setFont("helvetica", "normal");
  doc.raw.text("AI Resume Analysis Report", ML + 34, 11);

  if (grade) {
    doc.raw.setFontSize(14);
    doc.raw.setFont("helvetica", "bold");
    doc.raw.text(`Grade: ${grade}`, PAGE_W - MR, 11, { align: "right" });
  }

  doc.y = 22;
  doc.raw.setFontSize(9);
  doc.raw.setFont("helvetica", "normal");
  doc.raw.setTextColor(...C_MUTED);
  const fname = filename.length > 70 ? filename.slice(0, 67) + "…" : filename;
  doc.raw.text(fname, ML, doc.y);
  doc.y += 4;
  doc.raw.text(`Generated: ${new Date().toLocaleString()}`, ML, doc.y);
  doc.y += 6;
  doc.hr();
}

function drawScoreRow(doc: Doc, analysis: AnalysisResult) {
  doc.ensureSpace(22);
  const items: Array<{ label: string; value: string; color: [number,number,number] }> = [];
  if (analysis.overallScore != null)
    items.push({ label: "Overall Score", value: `${analysis.overallScore}/100`, color: C_PRIMARY });
  if (analysis.potentialScore != null)
    items.push({ label: "Potential Score", value: `${analysis.potentialScore}/100`, color: C_SUCCESS });
  if (analysis.interviewChancePercent != null)
    items.push({ label: "Interview Chance", value: `${analysis.interviewChancePercent}%`, color: C_YELLOW });
  if (analysis.grade)
    items.push({ label: "Grade", value: analysis.grade, color: C_PRIMARY });

  const colW = CONTENT_W / Math.max(items.length, 1);
  items.forEach((item, i) => {
    const x = ML + i * colW;
    doc.rect(x, doc.y, colW - 2, 18, C_BG);
    doc.raw.setFontSize(14);
    doc.raw.setFont("helvetica", "bold");
    doc.raw.setTextColor(...item.color);
    doc.raw.text(item.value, x + (colW - 2) / 2, doc.y + 10, { align: "center" });
    doc.raw.setFontSize(7);
    doc.raw.setFont("helvetica", "normal");
    doc.raw.setTextColor(...C_MUTED);
    doc.raw.text(item.label, x + (colW - 2) / 2, doc.y + 15, { align: "center" });
  });
  doc.y += 22;
}

function drawSummary(doc: Doc, summary: string) {
  doc.sectionHeading("AI Analysis Summary");
  doc.rect(ML, doc.y, CONTENT_W, 1, C_BG);
  doc.raw.setFillColor(...C_BG);
  // draw bg box first — estimate height
  const lines = doc.raw.splitTextToSize(summary, CONTENT_W - 6) as string[];
  const boxH = lines.length * 4 + 6;
  doc.ensureSpace(boxH);
  doc.rect(ML, doc.y, CONTENT_W, boxH, C_BG);
  doc.raw.setFontSize(8.5);
  doc.raw.setFont("helvetica", "normal");
  doc.raw.setTextColor(...C_DARK);
  doc.raw.text(lines, ML + 3, doc.y + 5);
  doc.y += boxH + 4;
}

function drawScoreBreakdown(doc: Doc, scoreData: ScoreData) {
  doc.sectionHeading("Score Breakdown");
  // Methodology note — derived from scoreDataToMetrics() in lib/types/resume.ts
  doc.raw.setFontSize(7.5);
  doc.raw.setFont("helvetica", "normal");
  doc.raw.setTextColor(...C_MUTED);
  const methodLine =
    "Scores are calculated across 7 weighted dimensions: ATS parsing, keyword coverage, " +
    "experience quality, formatting consistency, skills coverage, grammar & clarity, and " +
    "interview readiness. Overall score = weighted average of all 7 dimensions (+/-5 pts tolerance).";
  const methodLines = doc.raw.splitTextToSize(methodLine, CONTENT_W) as string[];
  doc.ensureSpace(methodLines.length * 3.5 + 4);
  doc.raw.text(methodLines, ML, doc.y);
  doc.y += methodLines.length * 3.5 + 4;
  const metrics = scoreDataToMetrics(scoreData);
  const colW = CONTENT_W / 2 - 1;
  metrics.forEach((m, i) => {
    if (i % 2 === 0) doc.ensureSpace(14);
    const x = ML + (i % 2) * (colW + 2);
    const y = doc.y;
    doc.rect(x, y, colW, 12, C_BG);
    // label
    doc.raw.setFontSize(7.5);
    doc.raw.setFont("helvetica", "bold");
    doc.raw.setTextColor(...C_DARK);
    doc.raw.text(m.label, x + 3, y + 5);
    // score
    doc.raw.setFontSize(10);
    doc.raw.setFont("helvetica", "bold");
    const sc = m.score;
    const col: [number,number,number] = sc >= 85 ? C_SUCCESS : sc >= 70 ? C_PRIMARY : sc >= 55 ? C_YELLOW : C_RED;
    doc.raw.setTextColor(...col);
    doc.raw.text(`${sc}`, x + colW - 8, y + 9, { align: "right" });
    // bar bg
    const barX = x + 3; const barY = y + 9.5; const barW = colW - 14;
    doc.rect(barX, barY, barW, 1.5, C_BORDER);
    doc.rect(barX, barY, barW * (sc / 100), 1.5, col);

    if (i % 2 === 1 || i === metrics.length - 1) doc.y += 14;
  });
  doc.gap(2);
}

function drawKeywords(doc: Doc, kw: AnalysisResult["keywordsData"]) {
  if (!kw) return;
  doc.sectionHeading("Keyword Intelligence");
  const groups = [
    { label: "Matched", items: kw.matched, color: C_SUCCESS },
    { label: "Missing", items: kw.missing, color: C_RED },
    { label: "Suggested", items: kw.suggested, color: C_YELLOW },
  ] as const;
  groups.forEach(({ label, items, color }) => {
    if (!items.length) return;
    doc.ensureSpace(8);
    doc.raw.setFontSize(8);
    doc.raw.setFont("helvetica", "bold");
    doc.raw.setTextColor(...color);
    doc.raw.text(label, ML, doc.y);
    doc.y += 4;
    // chips
    let cx = ML;
    items.forEach((k) => {
      const chipW = doc.raw.getTextWidth(k.label) + 6;
      if (cx + chipW > PAGE_W - MR) { cx = ML; doc.y += 6; doc.ensureSpace(7); }
      doc.rect(cx, doc.y - 3.5, chipW, 5, C_BG);
      doc.raw.setFontSize(7);
      doc.raw.setFont("helvetica", "normal");
      doc.raw.setTextColor(...C_DARK);
      doc.raw.text(k.label, cx + 3, doc.y);
      cx += chipW + 2;
    });
    doc.y += 5;
    doc.gap(2);
  });
  doc.gap(2);
}

function drawIssues(doc: Doc, issues: AnalysisResult["issuesData"]) {
  if (!issues?.length) return;
  doc.sectionHeading("Priority Fixes");
  const priorityColor = (p: string): [number,number,number] =>
    p === "critical" ? C_RED : p === "important" ? C_YELLOW : C_SUCCESS;

  issues.forEach((fix) => {
    const titleLines = doc.raw.splitTextToSize(fix.title, CONTENT_W - 30) as string[];
    const explLines = doc.raw.splitTextToSize(fix.explanation, CONTENT_W - 6) as string[];
    const recLines = fix.recommendation
      ? doc.raw.splitTextToSize(`Recommendation: ${fix.recommendation}`, CONTENT_W - 6) as string[]
      : [];
    const boxH = (titleLines.length + explLines.length + recLines.length) * 4 + 10;
    doc.ensureSpace(boxH);

    const y0 = doc.y;
    doc.rect(ML, y0, CONTENT_W, boxH, C_BG);
    const pc = priorityColor(fix.priority);
    doc.rect(ML, y0, 3, boxH, pc);

    // priority badge
    doc.raw.setFontSize(6.5);
    doc.raw.setFont("helvetica", "bold");
    doc.raw.setTextColor(...pc);
    doc.raw.text(fix.priority.toUpperCase(), ML + 5, y0 + 5);
    // score gain
    doc.raw.setTextColor(...C_PRIMARY);
    doc.raw.text(`+${fix.scoreGain} pts`, PAGE_W - MR, y0 + 5, { align: "right" });
    // title
    doc.raw.setFontSize(8.5);
    doc.raw.setFont("helvetica", "bold");
    doc.raw.setTextColor(...C_DARK);
    doc.raw.text(titleLines, ML + 5, y0 + 10);
    let ty = y0 + 10 + titleLines.length * 4;
    // explanation
    doc.raw.setFontSize(7.5);
    doc.raw.setFont("helvetica", "normal");
    doc.raw.setTextColor(...C_MUTED);
    doc.raw.text(explLines, ML + 5, ty);
    ty += explLines.length * 4;
    if (recLines.length) {
      doc.raw.setTextColor(...C_PRIMARY);
      doc.raw.text(recLines, ML + 5, ty);
    }
    doc.y = y0 + boxH + 3;
  });
}

function drawRecommendations(
  doc: Doc,
  recs: AnalysisResult["recommendationsData"],
  issueTitles: Set<string>,
) {
  if (!recs?.length) return;
  doc.sectionHeading("AI Recommendations");
  recs.forEach((rec) => {
    const isDuplicate = issueTitles.has(rec.title.trim().toLowerCase());
    if (isDuplicate) {
      // Already covered in Priority Fixes — compact reference only
      doc.ensureSpace(11);
      const y0 = doc.y;
      doc.rect(ML, y0, CONTENT_W, 8, C_BG);
      doc.raw.setFontSize(7.5);
      doc.raw.setFont("helvetica", "bold");
      doc.raw.setTextColor(...C_DARK);
      doc.raw.text(rec.title, ML + 4, y0 + 5);
      doc.raw.setFontSize(7);
      doc.raw.setFont("helvetica", "normal");
      doc.raw.setTextColor(...C_SUCCESS);
      doc.raw.text(`+${rec.scoreGain} pts  (see Priority Fixes)`, PAGE_W - MR, y0 + 5, { align: "right" });
      doc.y = y0 + 11;
      return;
    }
    const titleLines = doc.raw.splitTextToSize(rec.title, CONTENT_W - 30) as string[];
    const reasonLines = doc.raw.splitTextToSize(rec.reason, CONTENT_W - 6) as string[];
    const prevLines = doc.raw.splitTextToSize(`"${rec.preview}"`, CONTENT_W - 6) as string[];
    const boxH = (titleLines.length + reasonLines.length + prevLines.length) * 4 + 10;
    doc.ensureSpace(boxH);
    const y0 = doc.y;
    doc.rect(ML, y0, CONTENT_W, boxH, C_BG);
    doc.raw.setFontSize(6.5);
    doc.raw.setFont("helvetica", "bold");
    doc.raw.setTextColor(...C_SUCCESS);
    doc.raw.text(`+${rec.scoreGain} pts`, PAGE_W - MR, y0 + 5, { align: "right" });
    doc.raw.setFontSize(8.5);
    doc.raw.setFont("helvetica", "bold");
    doc.raw.setTextColor(...C_DARK);
    doc.raw.text(titleLines, ML + 4, y0 + 5);
    let ty = y0 + 5 + titleLines.length * 4;
    doc.raw.setFontSize(7.5);
    doc.raw.setFont("helvetica", "normal");
    doc.raw.setTextColor(...C_MUTED);
    doc.raw.text(reasonLines, ML + 4, ty);
    ty += reasonLines.length * 4;
    doc.raw.setTextColor(...C_PRIMARY);
    doc.raw.text(prevLines, ML + 4, ty);
    doc.y = y0 + boxH + 3;
  });
}

function drawSections(doc: Doc, sections: AnalysisResult["sectionsData"]) {
  if (!sections?.length) return;
  doc.sectionHeading("Section Analysis");
  sections.forEach((sec) => {
    const notDetected = sec.detected === false;
    const scoreColor: [number,number,number] =
      sec.score >= 80 ? C_SUCCESS : sec.score >= 60 ? C_YELLOW : C_RED;
    const weakLines = sec.weaknesses.length
      ? doc.raw.splitTextToSize("Weaknesses: " + sec.weaknesses.join(" • "), CONTENT_W - 6) as string[]
      : [];
    const strLines = sec.strengths.length
      ? doc.raw.splitTextToSize("Strengths: " + sec.strengths.join(" • "), CONTENT_W - 6) as string[]
      : [];
    const sugLines = doc.raw.splitTextToSize(
      sec.suggestion?.trim()
        ? "Suggestion: " + sec.suggestion
        : "No changes needed — this section is strong.",
      CONTENT_W - 6,
    ) as string[];
    const boxH = (weakLines.length + strLines.length + sugLines.length) * 4 + 14;
    doc.ensureSpace(boxH);
    const y0 = doc.y;
    doc.rect(ML, y0, CONTENT_W, boxH, C_BG);
    // title
    doc.raw.setFontSize(8.5);
    doc.raw.setFont("helvetica", "bold");
    doc.raw.setTextColor(...C_DARK);
    doc.raw.text(sec.title, ML + 4, y0 + 6);
    // score / not-detected badge
    if (notDetected) {
      doc.raw.setFontSize(6.5);
      doc.raw.setFont("helvetica", "normal");
      doc.raw.setTextColor(...C_MUTED);
      doc.raw.text("NOT DETECTED", PAGE_W - MR, y0 + 6, { align: "right" });
    } else {
      doc.raw.setFontSize(9);
      doc.raw.setFont("helvetica", "bold");
      doc.raw.setTextColor(...scoreColor);
      doc.raw.text(`${sec.score}/100`, PAGE_W - MR, y0 + 6, { align: "right" });
    }
    let ty = y0 + 10;
    doc.raw.setFontSize(7.5);
    doc.raw.setFont("helvetica", "normal");
    if (strLines.length) {
      doc.raw.setTextColor(...C_SUCCESS);
      doc.raw.text(strLines, ML + 4, ty);
      ty += strLines.length * 4;
    }
    if (weakLines.length) {
      doc.raw.setTextColor(...C_RED);
      doc.raw.text(weakLines, ML + 4, ty);
      ty += weakLines.length * 4;
    }
    doc.raw.setTextColor(...C_PRIMARY);
    doc.raw.text(sugLines, ML + 4, ty);
    doc.y = y0 + boxH + 3;
  });
}

function drawActionPlan(
  doc: Doc,
  steps: AnalysisResult["actionPlanData"],
  current: number,
  potential: number,
  issueTitles: Set<string>,
) {
  if (!steps?.length) return;
  doc.sectionHeading("Action Plan & Improvement Forecast");
  doc.raw.setFontSize(8);
  doc.raw.setFont("helvetica", "normal");
  doc.raw.setTextColor(...C_MUTED);
  doc.raw.text(`Current score: ${current}  ->  Potential score: ${potential}`, ML, doc.y);
  doc.y += 6;

  steps.forEach((step) => {
    const isDuplicate = issueTitles.has(step.title.trim().toLowerCase());
    const descTxt = isDuplicate
      ? "(See Priority Fixes for full details)"
      : step.description;
    const descLines = doc.raw.splitTextToSize(descTxt, CONTENT_W - 30) as string[];
    const boxH = descLines.length * 4 + 10;
    doc.ensureSpace(boxH);
    const y0 = doc.y;
    doc.rect(ML, y0, CONTENT_W, boxH, C_BG);
    // step circle
    doc.rect(ML + 2, y0 + 2, 6, 6, C_PRIMARY);
    doc.raw.setFontSize(7);
    doc.raw.setFont("helvetica", "bold");
    doc.raw.setTextColor(...C_WHITE);
    doc.raw.text(String(step.step), ML + 5, y0 + 6.5, { align: "center" });
    // title
    doc.raw.setFontSize(8.5);
    doc.raw.setFont("helvetica", "bold");
    doc.raw.setTextColor(...C_DARK);
    doc.raw.text(step.title, ML + 11, y0 + 6);
    // score gain
    doc.raw.setFontSize(7);
    doc.raw.setFont("helvetica", "normal");
    doc.raw.setTextColor(...C_SUCCESS);
    doc.raw.text(`+${step.scoreGain} pts`, PAGE_W - MR, y0 + 6, { align: "right" });
    // description
    doc.raw.setFontSize(7.5);
    doc.raw.setTextColor(...C_MUTED);
    doc.raw.setFont("helvetica", "normal");
    doc.raw.text(descLines, ML + 11, y0 + 10);
    doc.y = y0 + boxH + 3;
  });
}

function drawFooter(doc: Doc, pageNum: number) {
  doc.raw.setFontSize(6.5);
  doc.raw.setFont("helvetica", "normal");
  doc.raw.setTextColor(...C_MUTED);
  doc.raw.text("Generated by ResuMind AI · resumind.ai", ML, PAGE_H - 6);
  doc.raw.text(`Page ${pageNum}`, PAGE_W - MR, PAGE_H - 6, { align: "right" });
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * generateReportPdf
 *
 * Builds and saves a PDF for the given analysis result.
 * Must be called in a browser context (uses jsPDF dynamically).
 *
 * @param analysis  - Fully-mapped AnalysisResult from mapAnalysisRow()
 * @param filename  - Original resume filename (used in header + download name)
 */
export async function generateReportPdf(
  analysis: AnalysisResult,
  filename: string,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const doc = new Doc(pdf);

  // ── Build issue-title set for deduplication ─────────────────────────────────
  const issueTitles = new Set(
    (analysis.issuesData ?? []).map((f) => f.title.trim().toLowerCase()),
  );

  // ── Page 1: header + scores + summary ──────────────────────────────────────
  drawHeader(doc, filename, analysis.grade);
  drawScoreRow(doc, analysis);
  doc.gap(2);
  if (analysis.aiSummary) drawSummary(doc, analysis.aiSummary);

  // ── Score breakdown ─────────────────────────────────────────────────────────
  if (analysis.scoreData) {
    doc.gap(2);
    drawScoreBreakdown(doc, analysis.scoreData);
  }

  // ── Keywords ────────────────────────────────────────────────────────────────
  if (analysis.keywordsData) {
    doc.gap(2);
    drawKeywords(doc, analysis.keywordsData);
  }

  // ── Priority fixes ──────────────────────────────────────────────────────────
  if (analysis.issuesData?.length) {
    doc.gap(2);
    drawIssues(doc, analysis.issuesData);
  }

  // ── Recommendations ─────────────────────────────────────────────────────────
  if (analysis.recommendationsData?.length) {
    doc.gap(2);
    drawRecommendations(doc, analysis.recommendationsData, issueTitles);
  }

  // ── Section analysis ────────────────────────────────────────────────────────
  if (analysis.sectionsData?.length) {
    doc.gap(2);
    drawSections(doc, analysis.sectionsData);
  }

  // ── Action plan ─────────────────────────────────────────────────────────────
  if (
    analysis.actionPlanData?.length &&
    analysis.overallScore != null &&
    analysis.potentialScore != null
  ) {
    doc.gap(2);
    drawActionPlan(doc, analysis.actionPlanData, analysis.overallScore, analysis.potentialScore, issueTitles);
  }

  // ── Footer on every page ────────────────────────────────────────────────────
  const totalPages = (pdf as unknown as { internal: { getNumberOfPages(): number } })
    .internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    drawFooter(doc, p);
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  const baseName = filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-");
  pdf.save(`ResuMind-Resume-Analysis-${baseName}.pdf`);
}
