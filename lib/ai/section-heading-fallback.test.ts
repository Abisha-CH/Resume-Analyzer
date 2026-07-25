/**
 * Tests for section-heading-fallback.ts
 *
 * Coverage:
 *  1. normaliseHeading — trims, lowercases, collapses whitespace, strips trailing ":" / "|"
 *  2. extractStandaloneHeadings — returns short lines only, ignores long paragraph lines
 *  3. applyHeadingFallback
 *     a. Uppercase standalone headings → promoted to detected:true
 *     b. Title-case standalone headings → promoted to detected:true
 *     c. Already-detected sections → never overwritten
 *     d. Phrase inside paragraph ("I have experience in Python") → NOT detected
 *     e. All 7 required aliases work (summary, experience, education, skills,
 *        projects, certifications, awards)
 *     f. Section with no matching alias → stays detected:false
 *     g. AI-assigned non-zero score preserved; zero score raised to FALLBACK_MIN_SCORE
 */

import { describe, it, expect } from "vitest";
import {
  normaliseHeading,
  extractStandaloneHeadings,
  applyHeadingFallback,
} from "./section-heading-fallback";
import type { AIAnalysisResponse } from "./analysis-schema";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type SectionEntry = AIAnalysisResponse["sectionsData"][number];

function makeSection(
  id: string,
  detected: boolean,
  score = 0
): SectionEntry {
  return {
    id,
    title: id,
    detected,
    score,
    strengths: [],
    weaknesses: [],
    suggestion: "",
  };
}

// ─── normaliseHeading ────────────────────────────────────────────────────────

describe("normaliseHeading", () => {
  it("lowercases and trims", () => {
    expect(normaliseHeading("  WORK EXPERIENCE  ")).toBe("work experience");
  });

  it("collapses internal whitespace", () => {
    expect(normaliseHeading("TECHNICAL   SKILLS")).toBe("technical skills");
  });

  it("strips trailing colon", () => {
    expect(normaliseHeading("Education:")).toBe("education");
  });

  it("strips trailing pipe", () => {
    expect(normaliseHeading("Skills|")).toBe("skills");
  });

  it("handles mixed case with trailing colon", () => {
    expect(normaliseHeading("Professional Summary:")).toBe("professional summary");
  });

  it("returns empty string for blank input", () => {
    expect(normaliseHeading("   ")).toBe("");
  });
});

// ─── extractStandaloneHeadings ───────────────────────────────────────────────

describe("extractStandaloneHeadings", () => {
  it("extracts short uppercase heading lines", () => {
    const text = "WORK EXPERIENCE\nSome job title here\nEDUCATION\n";
    const set = extractStandaloneHeadings(text);
    expect(set.has("work experience")).toBe(true);
    expect(set.has("education")).toBe(true);
  });

  it("excludes long paragraph lines", () => {
    // 9 words — exceeds MAX_HEADING_WORDS=6
    const text = "I have extensive experience in software engineering and architecture\nSKILLS";
    const set = extractStandaloneHeadings(text);
    expect(set.has("i have extensive experience in software engineering and architecture")).toBe(false);
    expect(set.has("skills")).toBe(true);
  });

  it("normalises heading case before storing", () => {
    const text = "Technical Skills\n";
    const set = extractStandaloneHeadings(text);
    expect(set.has("technical skills")).toBe(true);
  });

  it("strips trailing colon before storing", () => {
    const text = "Certifications:\n";
    const set = extractStandaloneHeadings(text);
    expect(set.has("certifications")).toBe(true);
  });

  it("ignores blank lines", () => {
    const text = "\n\n  \nSKILLS\n";
    const set = extractStandaloneHeadings(text);
    expect(set.has("")).toBe(false);
    expect(set.has("skills")).toBe(true);
  });
});

// ─── applyHeadingFallback ────────────────────────────────────────────────────

describe("applyHeadingFallback — uppercase OCR headings", () => {
  const ocrText = [
    "JOHN DOE",
    "PROFESSIONAL SUMMARY",
    "Experienced engineer with 5 years building cloud systems.",
    "WORK EXPERIENCE",
    "Software Engineer at Acme Corp 2020-2023",
    "EDUCATION",
    "B.Sc Computer Science",
    "TECHNICAL SKILLS",
    "Python, TypeScript, AWS",
    "PROJECTS",
    "Personal Finance App",
    "CERTIFICATIONS",
    "AWS Certified Developer",
    "HONORS & AWARDS",
    "Dean's List 2022",
  ].join("\n");

  const initialSections: SectionEntry[] = [
    makeSection("contact", false),
    makeSection("summary", false),
    makeSection("experience", false),
    makeSection("education", false),
    makeSection("skills", false),
    makeSection("projects", false),
    makeSection("certifications", false),
    makeSection("awards", false),
  ];

  const result = applyHeadingFallback(initialSections, ocrText);

  it("detects summary from PROFESSIONAL SUMMARY heading", () => {
    expect(result.find((s) => s.id === "summary")?.detected).toBe(true);
  });

  it("detects experience from WORK EXPERIENCE heading", () => {
    expect(result.find((s) => s.id === "experience")?.detected).toBe(true);
  });

  it("detects education from EDUCATION heading", () => {
    expect(result.find((s) => s.id === "education")?.detected).toBe(true);
  });

  it("detects skills from TECHNICAL SKILLS heading", () => {
    expect(result.find((s) => s.id === "skills")?.detected).toBe(true);
  });

  it("detects projects from PROJECTS heading", () => {
    expect(result.find((s) => s.id === "projects")?.detected).toBe(true);
  });

  it("detects certifications from CERTIFICATIONS heading", () => {
    expect(result.find((s) => s.id === "certifications")?.detected).toBe(true);
  });

  it("detects awards from HONORS & AWARDS heading", () => {
    expect(result.find((s) => s.id === "awards")?.detected).toBe(true);
  });

  it("sets score to FALLBACK_MIN_SCORE when AI score was 0", () => {
    const summarySection = result.find((s) => s.id === "summary");
    expect(summarySection?.score).toBeGreaterThan(0);
  });
});

describe("applyHeadingFallback — title-case OCR headings", () => {
  const ocrText = [
    "Work Experience",
    "Software Engineer 2020-2023",
    "Education",
    "B.Sc Computer Science",
    "Skills",
    "Python, TypeScript",
    "Projects",
    "Finance App",
    "Certifications",
    "AWS cert",
  ].join("\n");

  const sections: SectionEntry[] = [
    makeSection("experience", false),
    makeSection("education", false),
    makeSection("skills", false),
    makeSection("projects", false),
    makeSection("certifications", false),
  ];

  const result = applyHeadingFallback(sections, ocrText);

  it("detects experience from title-case 'Work Experience'", () => {
    expect(result.find((s) => s.id === "experience")?.detected).toBe(true);
  });

  it("detects education from title-case 'Education'", () => {
    expect(result.find((s) => s.id === "education")?.detected).toBe(true);
  });

  it("detects skills from title-case 'Skills'", () => {
    expect(result.find((s) => s.id === "skills")?.detected).toBe(true);
  });

  it("detects projects from title-case 'Projects'", () => {
    expect(result.find((s) => s.id === "projects")?.detected).toBe(true);
  });

  it("detects certifications from title-case 'Certifications'", () => {
    expect(result.find((s) => s.id === "certifications")?.detected).toBe(true);
  });
});

describe("applyHeadingFallback — does NOT overwrite already-detected sections", () => {
  const ocrText = "WORK EXPERIENCE\nSoftware Engineer 2020-2023";

  it("leaves detected:true sections unchanged", () => {
    const sections: SectionEntry[] = [
      makeSection("experience", true, 85),
    ];
    const result = applyHeadingFallback(sections, ocrText);
    expect(result[0].detected).toBe(true);
    expect(result[0].score).toBe(85); // original AI score preserved
  });
});

describe("applyHeadingFallback — does NOT false-positive on paragraph text", () => {
  it("does not detect experience from 'I have experience in Python' sentence", () => {
    // This phrase is 7 words — exceeds the standalone-heading word limit.
    const text = "I have experience in Python and TypeScript\nContact: john@example.com";
    const sections: SectionEntry[] = [
      makeSection("experience", false),
    ];
    const result = applyHeadingFallback(sections, text);
    expect(result.find((s) => s.id === "experience")?.detected).toBe(false);
  });

  it("does not detect skills from a paragraph mentioning skills", () => {
    const text = "My core skills include communication and leadership which I developed over years of work.";
    const sections: SectionEntry[] = [makeSection("skills", false)];
    const result = applyHeadingFallback(sections, text);
    // This is a single long line (>6 words) — should not be treated as a heading
    expect(result.find((s) => s.id === "skills")?.detected).toBe(false);
  });
});

describe("applyHeadingFallback — section with no matching alias stays not-detected", () => {
  it("returns detected:false for unrecognised section ID", () => {
    const text = "REFERENCES\nAvailable on request";
    const sections: SectionEntry[] = [makeSection("references", false)];
    const result = applyHeadingFallback(sections, text);
    expect(result.find((s) => s.id === "references")?.detected).toBe(false);
  });
});

describe("applyHeadingFallback — preserves AI non-zero score when promoting", () => {
  it("keeps AI-assigned non-zero score even when fallback promotes section", () => {
    // AI gave score:40 but mistakenly set detected:false — fallback should
    // flip to detected:true and keep score:40
    const ocrText = "EDUCATION\nB.Sc Computer Science";
    const sections: SectionEntry[] = [makeSection("education", false, 40)];
    const result = applyHeadingFallback(sections, ocrText);
    expect(result[0].detected).toBe(true);
    expect(result[0].score).toBe(40);
  });
});

describe("applyHeadingFallback — additional alias variants", () => {
  it("detects summary from standalone 'Profile' heading", () => {
    const text = "Profile\nSenior engineer with 10 years experience";
    const sections: SectionEntry[] = [makeSection("summary", false)];
    const result = applyHeadingFallback(sections, text);
    expect(result[0].detected).toBe(true);
  });

  it("detects summary from standalone 'Objective' heading", () => {
    const text = "Objective\nSeek a challenging role in software engineering";
    const sections: SectionEntry[] = [makeSection("summary", false)];
    const result = applyHeadingFallback(sections, text);
    expect(result[0].detected).toBe(true);
  });

  it("detects experience from standalone 'Employment History' heading", () => {
    const text = "Employment History\nDeveloper at Acme 2019-2022";
    const sections: SectionEntry[] = [makeSection("experience", false)];
    const result = applyHeadingFallback(sections, text);
    expect(result[0].detected).toBe(true);
  });

  it("detects certifications from 'Licenses & Certifications' heading", () => {
    const text = "Licenses & Certifications\nAWS Solutions Architect";
    const sections: SectionEntry[] = [makeSection("certifications", false)];
    const result = applyHeadingFallback(sections, text);
    expect(result[0].detected).toBe(true);
  });

  it("detects awards from 'Honors' heading", () => {
    const text = "Honors\nDean's List 2021";
    const sections: SectionEntry[] = [makeSection("awards", false)];
    const result = applyHeadingFallback(sections, text);
    expect(result[0].detected).toBe(true);
  });
});
