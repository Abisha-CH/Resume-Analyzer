import { Settings, Bell, Shield, CreditCard, Trash2 } from "lucide-react";

const settingsGroups = [
  {
    title: "Notifications",
    icon: Bell,
    description: "Configure how and when you receive analysis notifications.",
    badge: "Coming soon",
  },
  {
    title: "Privacy & Security",
    icon: Shield,
    description: "Control data retention, delete resume files, and manage permissions.",
    badge: "Coming soon",
  },
  {
    title: "Billing & Plan",
    icon: CreditCard,
    description: "Manage your subscription, upgrade to Pro, and view invoices.",
    badge: "Coming soon",
  },
  {
    title: "Danger Zone",
    icon: Trash2,
    description: "Permanently delete your account and all associated data.",
    badge: "Coming soon",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Manage your account preferences and configuration.
        </p>
      </div>

      <div className="space-y-3">
        {settingsGroups.map(({ title, icon: Icon, description, badge }) => (
          <div
            key={title}
            className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-subtle ring-1 ring-border">
              <Icon className="h-5 w-5 text-foreground-muted" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                {badge && (
                  <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-semibold text-foreground-subtle ring-1 ring-border">
                    {badge}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-foreground-muted">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border-subtle bg-surface-subtle p-4">
        <Settings className="mt-0.5 h-4 w-4 shrink-0 text-foreground-subtle" aria-hidden="true" />
        <p className="text-xs text-foreground-muted">
          Full settings functionality will be available in a future milestone.
        </p>
      </div>
    </div>
  );
}
