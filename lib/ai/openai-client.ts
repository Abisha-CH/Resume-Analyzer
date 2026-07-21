import OpenAI from "openai";

if (!process.env.GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN environment variable is not set.");
}

/**
 * OpenAI SDK client configured for GitHub Models.
 *
 * GitHub Models exposes an OpenAI-compatible endpoint at:
 *   https://models.inference.ai.azure.com
 *
 * Authentication uses a GitHub Personal Access Token (classic or fine-grained)
 * passed as the Bearer token via the standard Authorization header.
 * The token is read from GITHUB_TOKEN — never hardcoded.
 */
export const openai = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN,
});
