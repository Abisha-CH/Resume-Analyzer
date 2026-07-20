import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        /* Semantic tokens — mirror globals.css @theme values */
        primary: {
          DEFAULT: "var(--color-primary)",
          hover:   "var(--color-primary-hover)",
          light:   "var(--color-primary-light)",
          muted:   "var(--color-primary-muted)",
        },
        secondary:  "var(--color-secondary)",
        accent: {
          DEFAULT: "var(--color-accent)",
          light:   "var(--color-accent-light)",
        },
        background: "var(--color-background)",
        surface: {
          DEFAULT: "var(--color-surface)",
          raised:  "var(--color-surface-raised)",
          subtle:  "var(--color-surface-subtle)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          subtle:  "var(--color-border-subtle)",
        },
        foreground: {
          DEFAULT: "var(--color-foreground)",
          muted:   "var(--color-foreground-muted)",
          subtle:  "var(--color-foreground-subtle)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          light:   "var(--color-success-light)",
          muted:   "var(--color-success-muted)",
        },
        warning:  "var(--color-warning)",
        error: {
          DEFAULT: "var(--color-error)",
          light:   "var(--color-error-light)",
          muted:   "var(--color-error-muted)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
