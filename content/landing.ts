import type {
  NavItem,
  Feature,
  Step,
  FAQItem,
  ComparisonRow,
  ReportItem,
  AudienceItem,
  ProblemItem,
  FooterLinkGroup,
} from "@/types";

// ─── Metadata ────────────────────────────────────────────────────────────────

export const siteMetadata = {
  title: "AI Resume Analyzer Pakistan | ATS Resume Checker",
  description:
    "Upload your resume and receive an instant AI-powered analysis that shows exactly why recruiters may reject your CV—and how to fix it. Free ATS resume checker built for Pakistan.",
  keywords: [
    "AI Resume Analyzer Pakistan",
    "ATS Resume Checker Pakistan",
    "Resume Checker Pakistan",
    "Resume Review AI",
    "Resume Optimization",
    "ATS Score Checker",
    "Resume Keyword Scanner",
    "CV Analyzer Pakistan",
    "Resume Improvement Tool",
    "Resume Feedback AI",
    "Resume Scanner",
  ],
};

// ─── Navigation ───────────────────────────────────────────────────────────────

export const navItems: NavItem[] = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

// ─── Hero ─────────────────────────────────────────────────────────────────────

export const hero = {
  headline: "Get More Interviews with an ATS-Optimized Resume",
  subheadline:
    "Upload your resume and receive an instant AI-powered analysis that shows exactly why recruiters may reject your CV—and how to fix it.",
  benefits: [
    "Free Resume Analysis",
    "ATS Compatibility Score",
    "Missing Skills & Keywords",
    "Job-Specific Resume Optimization",
  ],
  primaryCTA: "Analyze My Resume for Free",
  secondaryCTA: "See Sample Report",
  trustBadges: [
    "No Credit Card Required",
    "Secure Resume Upload",
    "Results in Under 30 Seconds",
  ],
};

// ─── Social Proof ─────────────────────────────────────────────────────────────

export const socialProof = {
  headline: "Trusted by students, graduates, freelancers, and professionals across Pakistan.",
  subheadline: "Resume optimized for applications on:",
  platforms: ["LinkedIn", "Rozee", "Indeed", "Bayt", "Mustakbil", "Company Career Portals"],
};

// ─── Problem ──────────────────────────────────────────────────────────────────

export const problem = {
  stat: "75%",
  statDescription: "of resumes are filtered before a recruiter ever sees them.",
  headline: "Why Most Resumes Never Reach Recruiters",
  items: [
    "Missing important keywords",
    "ATS can't properly read the formatting",
    "Skills don't match the job description",
    "Weak experience descriptions",
    "Generic resume sent to every company",
  ] satisfies string[],
  solution:
    "Our AI identifies these problems instantly and tells you exactly how to improve them.",
};

// ─── Features ─────────────────────────────────────────────────────────────────

export const features: Feature[] = [
  {
    title: "ATS Compatibility Score",
    description:
      "See how well your resume performs in Applicant Tracking Systems used by employers.",
    icon: "BarChart3",
  },
  {
    title: "Missing Keywords",
    description:
      "Discover which important skills and keywords recruiters are searching for.",
    icon: "Search",
  },
  {
    title: "Resume Improvement Suggestions",
    description:
      "Receive practical recommendations to improve every section of your resume.",
    icon: "Lightbulb",
  },
  {
    title: "AI Bullet Point Rewriting",
    description:
      "Transform basic job responsibilities into achievement-focused statements.",
    icon: "Wand2",
  },
  {
    title: "Job Match Analysis",
    description:
      "Compare your resume with any job description and identify missing qualifications.",
    icon: "Target",
  },
  {
    title: "Skill Gap Analysis",
    description:
      "Understand what skills employers expect for your target role.",
    icon: "TrendingUp",
  },
];

// ─── How It Works ─────────────────────────────────────────────────────────────

export const steps: Step[] = [
  {
    step: 1,
    title: "Upload Your Resume",
    description: "Upload your resume in PDF or DOCX format.",
  },
  {
    step: 2,
    title: "AI Analyzes Your Resume",
    description:
      "Our AI checks formatting, keywords, skills, experience, and ATS compatibility.",
  },
  {
    step: 3,
    title: "Receive Your Report",
    description: "Get actionable recommendations tailored to your resume.",
  },
  {
    step: 4,
    title: "Improve Your Resume",
    description:
      "Download an optimized version and apply with confidence.",
  },
];

// ─── Target Audience ──────────────────────────────────────────────────────────

export const audience = {
  headline: "Built for Pakistani Job Seekers",
  subheadline:
    "Whether you're applying for jobs in Pakistan or abroad, our analyzer understands what recruiters expect.",
  subtext: "Perfect for:",
  items: [
    "University Students",
    "Fresh Graduates",
    "Internship Applicants",
    "Entry-Level Professionals",
    "Career Changers",
    "Freelancers",
    "Software Engineers",
    "Business Graduates",
    "Overseas Job Applicants",
  ] satisfies AudienceItem["label"][],
};

// ─── Comparison ───────────────────────────────────────────────────────────────

export const comparison = {
  headline: "Why Choose Us?",
  rows: [
    { others: "Generic ATS Score", ours: "Detailed Resume Diagnosis" },
    { others: "Basic Keyword Check", ours: "Missing Skills + Missing Keywords" },
    { others: "Generic Feedback", ours: "Personalized Recommendations" },
    { others: "Limited Analysis", ours: "Resume + Job Description Matching" },
    { others: "Complicated Reports", ours: "Simple Actionable Insights" },
    { others: "International Focus", ours: "Built for Pakistan + Global Applications" },
  ] satisfies ComparisonRow[],
};

// ─── Report Preview ───────────────────────────────────────────────────────────

export const reportPreview = {
  headline: "See What You'll Learn",
  subheadline: "Your report includes:",
  items: [
    "Overall Resume Score",
    "ATS Compatibility",
    "Keyword Match",
    "Formatting Issues",
    "Grammar Issues",
    "Experience Quality",
    "Education Review",
    "Skills Analysis",
    "Missing Keywords",
    "Actionable Fixes",
    "Estimated Interview Readiness",
  ] satisfies ReportItem["label"][],
};

// ─── Value Proposition ────────────────────────────────────────────────────────

export const valueProp = {
  headline: "Designed to Help You Get Interviews",
  subheadline: "Your resume should answer three questions:",
  points: [
    "Can ATS read it?",
    "Does it contain the right keywords?",
    "Does it convince recruiters you're qualified?",
  ],
  cta: "We help you improve all three.",
};

// ─── Privacy ──────────────────────────────────────────────────────────────────

export const privacy = {
  headline: "Privacy & Security",
  subheadline: "Your privacy matters.",
  items: [
    "Secure file uploads",
    "Encrypted storage",
    "No resume sharing",
    "Delete your resume anytime",
    "Your data stays private",
  ],
};

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export const faqItems: FAQItem[] = [
  {
    question: "Is it really free?",
    answer: "Yes. You can analyze your resume for free.",
  },
  {
    question: "Which resume formats do you support?",
    answer: "PDF and DOCX.",
  },
  {
    question: "Can I compare my resume with a job description?",
    answer:
      "Yes. Upload a job description to receive tailored optimization suggestions.",
  },
  {
    question: "Does it work for Pakistani companies?",
    answer:
      "Yes. It is designed for Pakistani recruiters while also supporting international applications.",
  },
  {
    question: "Will my resume be shared?",
    answer: "No. Your resume remains private and secure.",
  },
  {
    question: "How long does analysis take?",
    answer: "Usually under 30 seconds.",
  },
];

// ─── Final CTA ────────────────────────────────────────────────────────────────

export const finalCTA = {
  headline: "Ready to Improve Your Resume?",
  subheadline:
    "Upload your resume today and discover what's preventing you from getting interviews.",
  primaryCTA: "Analyze My Resume for Free",
  reassurance: "No credit card required • Instant feedback • Secure upload",
};

// ─── Footer ───────────────────────────────────────────────────────────────────

export const footer = {
  brand: "Resume Analyzer Pakistan",
  tagline: "AI-powered resume analysis built for Pakistani job seekers.",
  linkGroups: [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Sample Report", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Blog", href: "#" },
        { label: "Resume Tips", href: "#" },
        { label: "ATS Guide", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
  ] satisfies FooterLinkGroup[],
  copyright: `© ${new Date().getFullYear()} Resume Analyzer Pakistan. All rights reserved.`,
};
