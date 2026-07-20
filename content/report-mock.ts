/**
 * Mock data for the AI Resume Analysis Report preview.
 * All data is illustrative — no real AI backend is connected.
 */

// ─── Hero / Summary ───────────────────────────────────────────────────────────

export const reportSummary = {
  filename: "Muhammad_Ali_Resume.pdf",
  analyzedAt: "Today at 2:14 PM",
  overallScore: 78,
  potentialScore: 91,
  grade: "B+",
  betterThan: 63,
  interviewChance: 42,
  improvement: +6, // vs last analysis (mock)
  aiSummary:
    "Your resume has a strong technical foundation and reads well through ATS systems. However, missing leadership keywords, the absence of measurable achievements, and limited quantified impact reduce its competitiveness for senior roles. Addressing three priority areas could increase your interview chances by an estimated 35%.",
};

// ─── Score Breakdown ─────────────────────────────────────────────────────────

export type ScoreStatus = "excellent" | "good" | "fair" | "needs-work";

export interface ScoreMetric {
  id: string;
  label: string;
  score: number;
  status: ScoreStatus;
  explanation: string;
  trend: number; // positive = up, negative = down, 0 = flat
}

export const scoreMetrics: ScoreMetric[] = [
  {
    id: "ats",
    label: "ATS Score",
    score: 72,
    status: "good",
    explanation: "Readable by most ATS systems. Minor formatting issues detected.",
    trend: +3,
  },
  {
    id: "keywords",
    label: "Keyword Match",
    score: 85,
    status: "excellent",
    explanation: "Strong technical keyword presence. Soft skills keywords are thin.",
    trend: +5,
  },
  {
    id: "experience",
    label: "Experience Quality",
    score: 68,
    status: "fair",
    explanation: "Job duties are listed but lack quantified achievements.",
    trend: 0,
  },
  {
    id: "formatting",
    label: "Formatting",
    score: 90,
    status: "excellent",
    explanation: "Clean layout, consistent fonts, and proper section headings.",
    trend: +2,
  },
  {
    id: "skills",
    label: "Skills Coverage",
    score: 74,
    status: "good",
    explanation: "Technical skills are well covered. Leadership skills are missing.",
    trend: -1,
  },
  {
    id: "grammar",
    label: "Grammar & Clarity",
    score: 88,
    status: "excellent",
    explanation: "Minimal grammar issues. Two sentences are overly complex.",
    trend: 0,
  },
  {
    id: "interview",
    label: "Interview Readiness",
    score: 64,
    status: "fair",
    explanation: "Good base, but lacks the impact statements recruiters look for.",
    trend: +6,
  },
];

// ─── Keyword Intelligence ─────────────────────────────────────────────────────

export type KeywordImpact = "high" | "medium" | "low";

export interface Keyword {
  label: string;
  impact: KeywordImpact;
}

export const matchedKeywords: Keyword[] = [
  { label: "React", impact: "high" },
  { label: "TypeScript", impact: "high" },
  { label: "Next.js", impact: "high" },
  { label: "SQL", impact: "medium" },
  { label: "REST API", impact: "medium" },
  { label: "Git", impact: "medium" },
  { label: "Node.js", impact: "high" },
  { label: "Testing", impact: "low" },
];

export const missingKeywords: Keyword[] = [
  { label: "Leadership", impact: "high" },
  { label: "Agile", impact: "high" },
  { label: "Team Management", impact: "high" },
  { label: "CI/CD", impact: "medium" },
  { label: "Docker", impact: "medium" },
  { label: "Communication", impact: "medium" },
  { label: "Mentorship", impact: "low" },
];

export const suggestedKeywords: Keyword[] = [
  { label: "System Design", impact: "high" },
  { label: "Microservices", impact: "medium" },
  { label: "Code Review", impact: "medium" },
  { label: "AWS", impact: "high" },
  { label: "Problem Solving", impact: "low" },
];

// ─── Priority Fixes ───────────────────────────────────────────────────────────

export type IssuePriority = "critical" | "important" | "optional";
export type EffortLevel = "5 min" | "15 min" | "30 min" | "1 hour";

export interface PriorityFix {
  id: string;
  priority: IssuePriority;
  title: string;
  explanation: string;
  scoreGain: number;
  effort: EffortLevel;
}

export const priorityFixes: PriorityFix[] = [
  {
    id: "f1",
    priority: "critical",
    title: "Add quantified achievements",
    explanation: "Replace task descriptions with impact statements using numbers and percentages.",
    scoreGain: 7,
    effort: "30 min",
  },
  {
    id: "f2",
    priority: "critical",
    title: "Include missing leadership keywords",
    explanation: "Add 'team leadership', 'mentorship', and 'Agile' to experience bullets.",
    scoreGain: 5,
    effort: "15 min",
  },
  {
    id: "f3",
    priority: "important",
    title: "Rewrite professional summary",
    explanation: "Your summary is generic. Make it role-specific with measurable outcomes.",
    scoreGain: 4,
    effort: "15 min",
  },
  {
    id: "f4",
    priority: "important",
    title: "Add CI/CD and Docker skills",
    explanation: "These are expected for senior engineering roles in 2024.",
    scoreGain: 3,
    effort: "5 min",
  },
  {
    id: "f5",
    priority: "optional",
    title: "Simplify two complex sentences",
    explanation: "Two bullet points exceed 25 words. Shorter is clearer for ATS and humans.",
    scoreGain: 2,
    effort: "5 min",
  },
  {
    id: "f6",
    priority: "optional",
    title: "Add a certifications section",
    explanation: "Even one certification signals continued learning to recruiters.",
    scoreGain: 1,
    effort: "5 min",
  },
];

// ─── AI Recommendations ───────────────────────────────────────────────────────

export interface AIRecommendation {
  id: string;
  title: string;
  scoreGain: number;
  reason: string;
  preview: string;
}

export const aiRecommendations: AIRecommendation[] = [
  {
    id: "r1",
    title: "Rewrite Professional Summary",
    scoreGain: 6,
    reason: "Recruiters decide in 6 seconds. A specific, metrics-driven summary triples engagement.",
    preview: "Results-driven full-stack engineer with 4+ years building scalable React/Node.js products, reducing load time by 40% and shipping features serving 200K+ users.",
  },
  {
    id: "r2",
    title: "Quantify Project Impact",
    scoreGain: 5,
    reason: "Resumes with numbers are 40% more likely to get interviews.",
    preview: "Refactored legacy API layer → reduced response time from 800ms to 120ms, improving user retention by 18%.",
  },
  {
    id: "r3",
    title: "Add Leadership Bullet",
    scoreGain: 4,
    reason: "Senior roles require leadership signals. Currently absent from your resume.",
    preview: "Mentored 3 junior developers, conducted weekly code reviews, and led sprint planning for a 6-person team.",
  },
];

// ─── Section Analysis ─────────────────────────────────────────────────────────

export interface ResumeSection {
  id: string;
  title: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestion: string;
}

export const resumeSections: ResumeSection[] = [
  {
    id: "summary",
    title: "Professional Summary",
    score: 62,
    strengths: ["Present and visible", "Correct placement"],
    weaknesses: ["Too generic", "No measurable outcomes", "Not role-specific"],
    suggestion: "Add your top two measurable achievements and the specific role you're targeting.",
  },
  {
    id: "experience",
    title: "Work Experience",
    score: 68,
    strengths: ["Correct date format", "Clear company names", "Good section structure"],
    weaknesses: ["Bullets describe duties, not impact", "No numbers or percentages", "Missing team size or scope"],
    suggestion: "Convert at least 3 bullet points to achievement statements using the STAR format.",
  },
  {
    id: "education",
    title: "Education",
    score: 88,
    strengths: ["Complete and well-formatted", "Correct ordering"],
    weaknesses: ["GPA not included (optional for 3.5+)"],
    suggestion: "Consider adding relevant coursework or academic projects if under 2 years of experience.",
  },
  {
    id: "skills",
    title: "Skills",
    score: 74,
    strengths: ["Good technical breadth", "Organized by category"],
    weaknesses: ["Missing soft skills", "No leadership-related skills", "Missing cloud/DevOps keywords"],
    suggestion: "Add: Leadership, Team Collaboration, Agile, Docker, AWS, CI/CD.",
  },
  {
    id: "projects",
    title: "Projects",
    score: 71,
    strengths: ["Projects are listed", "Tech stack mentioned"],
    weaknesses: ["No user impact stated", "No scale mentioned (users, requests/sec)", "Links missing"],
    suggestion: "Add GitHub links and describe the scale: users, traffic, or business impact.",
  },
  {
    id: "certifications",
    title: "Certifications",
    score: 50,
    strengths: [],
    weaknesses: ["Section is missing entirely"],
    suggestion: "Add any certifications or online courses. Even freeCodeCamp or Google certificates help.",
  },
];

// ─── Improvement Forecast ────────────────────────────────────────────────────

export const forecast = {
  currentScore: 78,
  potentialScore: 91,
  grade: { current: "B+", potential: "A" },
};

// ─── Action Plan ─────────────────────────────────────────────────────────────

export interface ActionStep {
  step: number;
  title: string;
  description: string;
  scoreGain: number;
}

export const actionPlan: ActionStep[] = [
  {
    step: 1,
    title: "Add missing keywords",
    description: "Insert leadership, Agile, Docker, and CI/CD into your skills and experience.",
    scoreGain: 5,
  },
  {
    step: 2,
    title: "Quantify achievements",
    description: "Add numbers to at least 4 experience bullets. Use %, time saved, users served.",
    scoreGain: 4,
  },
  {
    step: 3,
    title: "Rewrite professional summary",
    description: "Use the AI-generated suggestion above. Replace the current generic summary.",
    scoreGain: 3,
  },
  {
    step: 4,
    title: "Add project links & impact",
    description: "Link GitHub repos and state user impact or scale in each project.",
    scoreGain: 1,
  },
];
