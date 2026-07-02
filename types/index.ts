// Navigation
export interface NavItem {
  label: string;
  href: string;
}

// Features / What You'll Get
export interface Feature {
  title: string;
  description: string;
  icon: string; // Lucide icon name
}

// How It Works steps
export interface Step {
  step: number;
  title: string;
  description: string;
}

// FAQ
export interface FAQItem {
  question: string;
  answer: string;
}

// Comparison table row
export interface ComparisonRow {
  others: string;
  ours: string;
}

// Report item (what's included)
export interface ReportItem {
  label: string;
}

// Target audience item
export interface AudienceItem {
  label: string;
}

// Problem item
export interface ProblemItem {
  text: string;
}

// Footer link group
export interface FooterLinkGroup {
  title: string;
  links: NavItem[];
}
