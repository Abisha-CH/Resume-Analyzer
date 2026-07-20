import { currentUser } from "@clerk/nextjs/server";
import { UserProfile } from "@clerk/nextjs";
import { User } from "lucide-react";

export default async function ProfilePage() {
  const user = await currentUser();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Manage your personal information and account.
        </p>
      </div>

      {/* Quick info */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-light ring-2 ring-primary-muted">
          <User className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold text-foreground">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-foreground-muted">
            {user?.emailAddresses?.[0]?.emailAddress}
          </p>
        </div>
      </div>

      {/* Clerk hosted profile management */}
      <UserProfile routing="hash" />
    </div>
  );
}
