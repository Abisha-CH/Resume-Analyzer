/**
 * Plain-text section-heading fallback for OCR-extracted resume text.
 *
 * Purpose
 * ───────
 * The AI model detects resume sections from the extracted text.  For
 * text-based PDFs this works well.  For OCR-extracted text the AI
 * occasionally marks sections as `detected: false` even when the OCR
 * output contains the heading (e.g. "WORK EXPERIENCE", "TECHNICAL SKILLS").
 *
 * This module provides a deterministic fallback that runs AFTER the AI
 * returns its response.  For every section the AI marked as NOT detected,
 * we scan the raw extracted text for a matching standalone heading line.
 * If we find one we flip `detected` to `true` and set `score` to a
 * conservative non-zero floor value (1) so downstream UI can display the
 * section as present.
 *
 * Rules
 * ─────
 * • Only fill sections the AI did NOT already detect.
 *   Never overwrite detected: true entries.
 * • Match headings as STANDALONE LINES only (≤ MAX_HEADING_WORDS words).
 *   This prevents matching phrases like "I have experience in Python".
 * • Normalise before matching: trim, lowercase, collapse whitespace,
 *   strip trailing ":" and "|".
 * • Preserve all other fields from the AI's original section entry.
 */

import type { AIAnalysisResponse } from "./analysis-schema";

// ─── Configuration ──────────────────────────────────────────────────────────

/**
 * A standalone heading line must contain no more than this many words.
 * "WORK EXPERIENCE" = 2 words  ✓
 * "I have experience in Python" = 5 words  ✓ but no alias matches it
 * "PROFESSIONAL EXPERIENCE AT ACME CORP INC" = 6 words — excluded as heading
 */
const MAX_HEADING_WORDS = 6;

/**
 * Minimum detected score assigned when the fallback promotes a section
 * from not-detected to detected.  Kept at 1 (not 0) so callers can
 * distinguish "AI said not present" (0) from "fallback confirmed present" (1+).
 * The AI has already provided its quality score in the entry; we only raise
 * the floor when flipping detected false → true AND the score was 0.
 */
const FALLBACK_MIN_SCORE = 1;

// ─── Alias table ─────────────────────────────────────────────────────────────
// Map from canonical section ID → accepted plain-text heading aliases.
// All aliases are lowercase; the normaliser handles case at match time.

const SECTION_ALIASES: Record<string, string[]> = {
  summary: [
    "professional summary",
    "summary",
    "profile",
    "professional profile",
    "objective",
    "career objective",
    "career summary",
    "about me",
    "personal statement",
  ],
  experience: [
    "work experience",
    "professional experience",
    "experience",
    "employment history",
    "work history",
    "career history",
    "teaching & work experience",
    "teaching and work experience",
  ],
  education: [
    "education",
    "academic background",
    "educational background",
    "academic qualifications",
    "academic history",
  ],
  skills: [
    "technical skills",
    "skills",
    "core skills",
    "key skills",
    "technical expertise",
    "laboratory skills",
    "computational skills",
    "laboratory and computational skills",
    "research and diagnostic laboratory skills",
  ],
  projects: [
    "projects",
    "personal projects",
    "academic projects",
    "key projects",
    "research projects",
    "research projects & publications",
    "research projects and publications",
  ],
  certifications: [
    "certifications",
    "certificates",
    "licenses & certifications",
    "licenses and certifications",
    "courses & certifications",
    "certifications & courses",
    "training & certifications",
    "professional certifications",
    "courses",
    "training",
  ],
  awards: [
    "awards",
    "honors & awards",
    "honors and awards",
    "honors",
    "achievements",
    "grants",
    "grants & awards",
    "grants and awards",
  ],
  contact: [
    "contact",
    "contact information",
    "personal information",
    "contact details",
  ],
};

// ─── Normalisation ────────────────────────────────────────────────────────────

/**
 * Normalise a heading candidate line for alias matching:
 *   1. Trim surrounding whitespace.
 *   2. Lowercase.
 *   3. Collapse runs of whitespace to a single space.
 *   4. Strip a trailing ":" or "|" character.
 */
export function normaliseHeading(line: string): string {
  return line
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[:|]+$/, "")
    .trim();
}

// ─── Standalone-line extraction ───────────────────────────────────────────────

/**
 * Return the set of normalised standalone heading candidates from
 * `extractedText`.  A line qualifies as a standalone heading candidate
 * when it contains no more than MAX_HEADING_WORDS whitespace-separated
 * tokens (after normalisation).
 */
export function extractStandaloneHeadings(extractedText: string): Set<string> {
  const headings = new Set<string>();
  for (const raw of extractedText.split("\n")) {
    const normalised = normaliseHeading(raw);
    if (normalised.length === 0) continue;
    const wordCount = normalised.split(/\s+/).length;
    if (wordCount <= MAX_HEADING_WORDS) {
      headings.add(normalised);
    }
  }
  return headings;
}

// ─── Section ID resolution ────────────────────────────────────────────────────

/**
 * Attempt to resolve a section entry's canonical ID from its `id` field.
 * The AI may return ids like "experience", "work_experience", "section_3", etc.
 * We normalise and match against the alias-table keys.
 */
function resolveCanonicalId(sectionId: string): string | null {
  const norm = sectionId.toLowerCase().replace(/[^a-z]/g, "");
  for (const key of Object.keys(SECTION_ALIASES)) {
    if (norm.includes(key) || key.includes(norm)) return key;
  }
  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Apply the plain-text section heading fallback to `sectionsData`.
 *
 * For each section that the AI marked as `detected: false`, scan the
 * extracted text for a matching standalone heading line.  If found,
 * promote the section to `detected: true`.
 *
 * Returns a new `sectionsData` array (does not mutate the input).
 */
export function applyHeadingFallback(
  sectionsData: AIAnalysisResponse["sectionsData"],
  extractedText: string
): AIAnalysisResponse["sectionsData"] {
  // Build the set of standalone heading candidates once.
  const headings = extractStandaloneHeadings(extractedText);

  return sectionsData.map((section) => {
    // Never overwrite a section the AI already confirmed as detected.
    if (section.detected !== false) return section;

    // Resolve the canonical section ID so we can look up its aliases.
    const canonicalId = resolveCanonicalId(section.id);
    if (!canonicalId) return section;

    const aliases = SECTION_ALIASES[canonicalId];
    if (!aliases) return section;

    // Check whether any standalone heading line matches an alias.
    const found = aliases.some((alias) => headings.has(alias));
    if (!found) return section;

    // Promote to detected: true with a conservative score floor.
    return {
      ...section,
      detected: true,
      score: section.score > 0 ? section.score : FALLBACK_MIN_SCORE,
    };
  });
}
