import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/db";
import { users } from "@/db/schema";

// ─── Clerk webhook event types (minimal — add more as needed) ─────────────────

interface ClerkEmailAddress {
  email_address: string;
  id: string;
}

interface ClerkUserCreatedData {
  id: string;
  email_addresses: ClerkEmailAddress[];
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
}

interface ClerkUserUpdatedData extends ClerkUserCreatedData {}

interface ClerkUserDeletedData {
  id: string;
  deleted: boolean;
}

type ClerkWebhookEvent =
  | { type: "user.created"; data: ClerkUserCreatedData }
  | { type: "user.updated"; data: ClerkUserUpdatedData }
  | { type: "user.deleted"; data: ClerkUserDeletedData };

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // 1. Verify the webhook secret is configured
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[clerk-webhook] CLERK_WEBHOOK_SECRET is not set.");
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 500 }
    );
  }

  // 2. Read Svix signature headers
  const headerPayload = await headers();
  const svixId        = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing Svix headers." },
      { status: 400 }
    );
  }

  // 3. Verify the signature
  const body = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: ClerkWebhookEvent;
  try {
    event = wh.verify(body, {
      "svix-id":        svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("[clerk-webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  // 4. Route to the appropriate handler
  try {
    switch (event.type) {
      case "user.created":
        await handleUserCreated(event.data);
        break;
      case "user.updated":
        await handleUserUpdated(event.data);
        break;
      case "user.deleted":
        await handleUserDeleted(event.data);
        break;
      default:
        // Unhandled event type — acknowledge receipt so Clerk doesn't retry
        break;
    }
  } catch (err) {
    console.error(`[clerk-webhook] Handler error for ${event.type}:`, err);
    return NextResponse.json(
      { error: "Internal server error while processing event." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleUserCreated(data: ClerkUserCreatedData) {
  const email = data.email_addresses[0]?.email_address;

  if (!email) {
    console.warn("[clerk-webhook] user.created — no email address found, skipping.");
    return;
  }

  await db.insert(users).values({
    id:              data.id,           // Clerk userId doubles as our PK
    clerkId:         data.id,
    email,
    firstName:       data.first_name  ?? null,
    lastName:        data.last_name   ?? null,
    imageUrl:        data.image_url   ?? null,
    plan:            "free",
    analysisCredits: "3",
    isActive:        true,
  });

  console.log(`[clerk-webhook] user.created — inserted user ${data.id} (${email})`);
}

async function handleUserUpdated(data: ClerkUserUpdatedData) {
  const email = data.email_addresses[0]?.email_address;

  if (!email) {
    console.warn("[clerk-webhook] user.updated — no email address found, skipping.");
    return;
  }

  await db
    .insert(users)
    .values({
      id:              data.id,
      clerkId:         data.id,
      email,
      firstName:       data.first_name ?? null,
      lastName:        data.last_name  ?? null,
      imageUrl:        data.image_url  ?? null,
      plan:            "free",
      analysisCredits: "3",
      isActive:        true,
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        email:     email,
        firstName: data.first_name ?? null,
        lastName:  data.last_name  ?? null,
        imageUrl:  data.image_url  ?? null,
        updatedAt: new Date(),
      },
    });

  console.log(`[clerk-webhook] user.updated — upserted user ${data.id}`);
}

async function handleUserDeleted(data: ClerkUserDeletedData) {
  // Soft-delete: mark isActive = false rather than hard-deleting.
  // This preserves historical analysis data linked to the user row.
  const { eq } = await import("drizzle-orm");

  await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.clerkId, data.id));

  console.log(`[clerk-webhook] user.deleted — deactivated user ${data.id}`);
}
