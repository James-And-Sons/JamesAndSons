"use client";

import { useState, useTransition } from "react";
import {
  inviteAdminAction,
  updateAdminPermissionsAction,
  removeAdminAction,
} from "./actions";

export type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  createdAt: Date;
};

// All available permission sections
export const PERMISSION_SECTIONS = [
  { key: "dashboard", label: "📊 Dashboard Overview", group: "Navigation" },
  { key: "orders", label: "📦 Orders & Fulfillment", group: "Navigation" },
  { key: "rfqs", label: "💬 Inquiries & B2B RFQs", group: "Navigation" },
  {
    key: "catalog",
    label: "🏷️ Product Catalog & Collections",
    group: "Navigation",
  },
  { key: "b2b", label: "🏢 B2B Corporate Workspace", group: "Navigation" },
  {
    key: "accounting",
    label: "📑 Accounting & GST Reports",
    group: "Navigation",
  },
  { key: "blog", label: "✍️ Blog & Content Management", group: "Navigation" },
  { key: "seo", label: "🔍 SEO & Storefront Performance", group: "Navigation" },
  { key: "marketing", label: "📢 Marketing & Campaigns", group: "Navigation" },
  {
    key: "push_campaigns",
    label: "🔔 Push Notifications & Marketing",
    group: "Navigation",
  },
  { key: "coupons", label: "🎟️ Coupons & Promotions", group: "Navigation" },
  { key: "affiliates", label: "🤝 Affiliate Program", group: "Navigation" },
  { key: "tickets", label: "🎧 Customer Support Tickets", group: "Navigation" },
  { key: "customers", label: "👥 Customer Directory", group: "Navigation" },
  { key: "logistics", label: "🚚 Logistics & Couriers", group: "Navigation" },
  { key: "settings", label: "⚙️ Settings Overview", group: "Navigation" },
  // Settings Subpanels
  {
    key: "manage_admins",
    label: "🛡️ Manage Admins & Permissions",
    group: "Settings Access",
  },
  {
    key: "system_sync",
    label: "🔄 Marketplace & System Sync",
    group: "Settings Access",
  },
  {
    key: "catalogues_manage",
    label: "📂 Catalogue Exports & Downloads",
    group: "Settings Access",
  },
];

export const ALL_PERMISSIONS = PERMISSION_SECTIONS.map((p) => p.key);

export const ROLE_PRESETS = [
  {
    name: "Super Administrator",
    id: "SUPER_ADMIN",
    description:
      "Full un-restricted system access across all panels & settings.",
    permissions: ALL_PERMISSIONS,
  },
  {
    name: "Store Manager",
    id: "STORE_MANAGER",
    description:
      "Manages orders, products, inventory, customers, and fulfillment.",
    permissions: [
      "dashboard",
      "orders",
      "catalog",
      "customers",
      "logistics",
      "settings",
    ],
  },
  {
    name: "Accounts & Finance",
    id: "ACCOUNTS_FINANCE",
    description:
      "Access to GST filing, financial exports, orders, and sales accounting.",
    permissions: ["dashboard", "orders", "accounting", "settings"],
  },
  {
    name: "Marketing & Sales",
    id: "MARKETING_GROWTH",
    description:
      "Manages campaigns, coupons, blog posts, and product listings.",
    permissions: [
      "dashboard",
      "catalog",
      "blog",
      "marketing",
      "push_campaigns",
      "coupons",
      "affiliates",
      "settings",
    ],
  },
  {
    name: "Support & Operations",
    id: "SUPPORT_OPS",
    description:
      "Handles support tickets, customer inquiries, order updates, and logistics.",
    permissions: [
      "dashboard",
      "orders",
      "rfqs",
      "tickets",
      "customers",
      "logistics",
      "settings",
    ],
  },
  {
    name: "Custom Staff Role",
    id: "CUSTOM",
    description: "Tailored permission checkboxes configured individually.",
    permissions: [],
  },
];

export default function ManageAdminsClient({
  admins,
}: {
  admins: AdminUser[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("SUPER_ADMIN");
  const [selectedPermissions, setSelectedPermissions] =
    useState<string[]>(ALL_PERMISSIONS);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = ROLE_PRESETS.find((r) => r.id === presetId);
    if (preset && presetId !== "CUSTOM") {
      setSelectedPermissions(preset.permissions);
    }
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      setSelectedPreset("CUSTOM");
      return next;
    });
  };

  const handleSelectAll = (select: boolean) => {
    setSelectedPermissions(select ? ALL_PERMISSIONS : []);
    setSelectedPreset(select ? "SUPER_ADMIN" : "CUSTOM");
  };

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const fd = new FormData(e.currentTarget);
    fd.append("permissions", selectedPermissions.join(","));

    startTransition(async () => {
      const result = await inviteAdminAction(fd);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Staff invitation sent successfully!");
        setShowForm(false);
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  async function handleUpdatePermissions() {
    if (!editingAdmin) return;
    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await updateAdminPermissionsAction(
        editingAdmin.id,
        selectedPermissions,
      );
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(`Permissions updated for ${editingAdmin.firstName}!`);
        setEditingAdmin(null);
      }
    });
  }

  async function handleRemove(id: string, email: string) {
    if (!confirm(`Are you sure you want to revoke staff access for ${email}?`))
      return;
    setError("");
    startTransition(async () => {
      const result = await removeAdminAction(id);
      if (result.error) {
        setError(`Failed to remove staff: ${result.error}`);
      } else {
        setSuccess(`Staff access revoked for ${email}.`);
      }
    });
  }

  const superAdminCount = admins.filter(
    (a) =>
      (a.permissions || []).length === 0 ||
      (a.permissions || []).length === ALL_PERMISSIONS.length,
  ).length;

  return (
    <div className="space-y-6">
      {/* ── Stat Banner Header ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-surface border border-border rounded-sm">
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-1">
            Total Staff
          </p>
          <p className="font-serif text-[24px] text-primary font-light">
            {admins.length}
          </p>
        </div>
        <div className="p-4 bg-surface border border-border rounded-sm">
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-1">
            Super Admins
          </p>
          <p className="font-serif text-[24px] text-accent font-light">
            {superAdminCount}
          </p>
        </div>
        <div className="p-4 bg-surface border border-border rounded-sm">
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-1">
            Limited Staff
          </p>
          <p className="font-serif text-[24px] text-blue-400 font-light">
            {admins.length - superAdminCount}
          </p>
        </div>
        <div className="p-4 bg-surface border border-border rounded-sm">
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-1">
            System Status
          </p>
          <p className="font-mono text-[11px] text-emerald-400 mt-1 uppercase tracking-wider">
            ● Access Controlled
          </p>
        </div>
      </div>

      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center bg-surface p-4 sm:p-6 border border-border">
        <div>
          <h2 className="font-serif text-[20px] font-light text-primary m-0">
            Staff Members & Permissions
          </h2>
          <p className="font-mono text-[10px] text-muted mt-1 tracking-wider uppercase">
            Configure fine-grained access control per admin user
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingAdmin(null);
            setSelectedPermissions(ALL_PERMISSIONS);
            setSelectedPreset("SUPER_ADMIN");
          }}
          className="btn-primary font-mono text-[10px] uppercase tracking-[0.12em] px-5 py-2.5"
        >
          {showForm ? "Cancel" : "+ Add Staff Member"}
        </button>
      </div>

      {error && (
        <div className="p-4 border border-red-900/40 bg-red-900/10 text-red-400 font-mono text-[11px]">
          ⚠ {error}
        </div>
      )}
      {success && (
        <div className="p-4 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-mono text-[11px]">
          ✅ {success}
        </div>
      )}

      {/* ── Invite / Edit Permission Matrix Drawer ────────────────────────── */}
      {(showForm || editingAdmin) && (
        <div className="bg-surface border border-accent/30 p-6 sm:p-8 space-y-6 rounded-sm shadow-2xl">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <div>
              <h3 className="font-serif text-[22px] text-primary font-light m-0">
                {editingAdmin
                  ? `Edit Permissions for ${editingAdmin.firstName} ${editingAdmin.lastName}`
                  : "Invite New Staff Member"}
              </h3>
              <p className="font-mono text-[10px] text-muted mt-1 uppercase tracking-wider">
                {editingAdmin
                  ? editingAdmin.email
                  : "Select a role preset or customize individual section access below"}
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingAdmin(null);
              }}
              className="text-muted hover:text-primary font-mono text-[12px]"
            >
              ✕ Close
            </button>
          </div>

          {!editingAdmin && (
            <form
              id="invite-form"
              onSubmit={handleInvite}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-2">
                  First Name *
                </label>
                <input
                  required
                  name="firstName"
                  className="w-full bg-background border border-border px-4 py-2.5 text-[13px] text-primary focus:outline-none focus:border-accent font-sans"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-2">
                  Last Name
                </label>
                <input
                  name="lastName"
                  className="w-full bg-background border border-border px-4 py-2.5 text-[13px] text-primary focus:outline-none focus:border-accent font-sans"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-2">
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  className="w-full bg-background border border-border px-4 py-2.5 text-[13px] text-primary focus:outline-none focus:border-accent font-mono"
                />
              </div>
            </form>
          )}

          {/* ── Role Presets Selector ─────────────────────────────────────── */}
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent block mb-3 font-semibold">
              1. Select Role Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ROLE_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`p-3.5 text-left border transition-all rounded-sm cursor-pointer ${
                      isSelected
                        ? "border-accent bg-accent/10 text-primary shadow-sm"
                        : "border-border bg-background/50 hover:border-accent/40 text-muted"
                    }`}
                  >
                    <p className="font-serif text-[15px] font-medium text-primary m-0 flex items-center justify-between">
                      {preset.name}
                      {isSelected && (
                        <span className="font-mono text-[10px] text-accent">
                          ✓ Selected
                        </span>
                      )}
                    </p>
                    <p className="font-sans text-[11px] text-muted mt-1 leading-snug">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Section Permission Checkbox Matrix ────────────────────────── */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent font-semibold m-0">
                2. Section Access Matrix ({selectedPermissions.length} of{" "}
                {ALL_PERMISSIONS.length} enabled)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="font-mono text-[9px] uppercase tracking-wider text-accent hover:underline"
                >
                  Select All
                </button>
                <span className="text-muted">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="font-mono text-[9px] uppercase tracking-wider text-muted hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 bg-background p-4 border border-border">
              {PERMISSION_SECTIONS.map((sec) => {
                const checked = selectedPermissions.includes(sec.key);
                return (
                  <label
                    key={sec.key}
                    className={`flex items-center gap-3 p-3 border rounded-sm cursor-pointer transition-colors ${
                      checked
                        ? "border-accent/40 bg-surface text-primary"
                        : "border-border/60 bg-transparent text-muted hover:border-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(sec.key)}
                      className="w-4 h-4 accent-[#C97E6A] rounded-sm cursor-pointer"
                    />
                    <span className="font-sans text-[12px] font-medium">
                      {sec.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingAdmin(null);
              }}
              className="px-6 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted border border-border hover:bg-white/5"
            >
              Cancel
            </button>

            {editingAdmin ? (
              <button
                type="button"
                onClick={handleUpdatePermissions}
                disabled={isPending}
                className="btn-primary font-mono text-[10px] uppercase tracking-widest px-8 py-2.5 disabled:opacity-50"
              >
                {isPending ? "Updating..." : "Save Updated Permissions ↗"}
              </button>
            ) : (
              <button
                form="invite-form"
                type="submit"
                disabled={isPending}
                className="btn-primary font-mono text-[10px] uppercase tracking-widest px-8 py-2.5 disabled:opacity-50"
              >
                {isPending
                  ? "Sending Invitation..."
                  : "Send Staff Invitation ↗"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Admins Directory Table ────────────────────────────────────────── */}
      <div className="bg-surface border border-border overflow-hidden rounded-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[650px]">
            <thead className="border-b border-border text-muted bg-background/50">
              <tr>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">
                  Staff Member
                </th>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">
                  Access Level
                </th>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">
                  Allowed Sections
                </th>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {admins.map((admin) => {
                const perms = admin.permissions || [];
                const isSuper =
                  perms.length === 0 || perms.length === ALL_PERMISSIONS.length;
                const activeCount = isSuper
                  ? ALL_PERMISSIONS.length
                  : perms.length;

                return (
                  <tr
                    key={admin.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/30 text-accent font-serif text-[15px] flex items-center justify-center font-bold">
                          {admin.firstName?.[0] || "A"}
                        </div>
                        <div>
                          <p className="font-serif text-[15px] text-primary font-medium m-0">
                            {admin.firstName} {admin.lastName}
                          </p>
                          <p className="font-mono text-[11px] text-muted m-0">
                            {admin.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {isSuper ? (
                        <span className="inline-block px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[9px] uppercase tracking-wider rounded-xs font-semibold">
                          🛡️ Super Admin
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-[9px] uppercase tracking-wider rounded-xs font-semibold">
                          🔒 Limited ({activeCount} Sections)
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {isSuper ? (
                          <span className="font-mono text-[10px] text-muted">
                            All 17 sections unlocked
                          </span>
                        ) : (
                          perms.map((p) => {
                            const label =
                              PERMISSION_SECTIONS.find(
                                (sec) => sec.key === p,
                              )?.label.split(" ")[1] || p;
                            return (
                              <span
                                key={p}
                                className="px-1.5 py-0.5 bg-background border border-border text-muted font-mono text-[9px] rounded-xs"
                              >
                                {label}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right space-x-3">
                      <button
                        onClick={() => {
                          setEditingAdmin(admin);
                          setShowForm(false);
                          setSelectedPermissions(
                            isSuper ? ALL_PERMISSIONS : perms,
                          );
                          setSelectedPreset(isSuper ? "SUPER_ADMIN" : "CUSTOM");
                        }}
                        className="font-mono text-[10px] uppercase tracking-wider text-accent hover:underline"
                      >
                        Edit Access ⚙️
                      </button>
                      <button
                        onClick={() => handleRemove(admin.id, admin.email)}
                        className="font-mono text-[10px] uppercase tracking-wider text-red-400 hover:underline"
                      >
                        Revoke ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
