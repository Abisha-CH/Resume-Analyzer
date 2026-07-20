import { NextResponse } from "next/server";

/**
 * Temporary diagnostic route — DELETE after debugging is complete.
 * Visit /api/debug-clerk to verify environment variable loading.
 */
export async function GET() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  return NextResponse.json({
    envPublishableKey: publishableKey ?? null,
    envPublishableKeyLength: publishableKey?.length ?? 0,
    envPublishableKeyPrefix: publishableKey?.slice(0, 20) ?? null,
    envSecretExists: Boolean(secretKey),
    nodeEnv: process.env.NODE_ENV,
  });
}
