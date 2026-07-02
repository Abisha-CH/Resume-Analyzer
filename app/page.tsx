/**
 * Root route — delegates to the marketing landing page.
 * The actual page content lives in app/(marketing)/page.tsx.
 * This file exists only for backwards compatibility with the root `/` path.
 * Once the (marketing) route group is the sole entry point this file can be removed.
 */
export { default } from "./(marketing)/page";
