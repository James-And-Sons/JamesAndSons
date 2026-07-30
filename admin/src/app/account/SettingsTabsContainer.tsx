'use client';

import { useState } from 'react';
import PWAInstallButton from '@/components/PWAInstallButton';
import BrandSettingsForm from './BrandSettingsForm';

interface SettingsTabsContainerProps {
  userEmail: string;
  userFullName: string;
  brandConfig: any;
}

export default function SettingsTabsContainer({
  userEmail,
  userFullName,
  brandConfig,
}: SettingsTabsContainerProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'brand'>('general');

  return (
    <div className="space-y-6">
      {/* Tabs Selector Bar */}
      <div className="flex border-b border-border gap-4 shrink-0">
        <button
          onClick={() => setActiveTab('general')}
          className={`font-mono text-[11px] uppercase tracking-wider pb-3 border-b-2 transition-all cursor-pointer min-h-[40px] px-2 font-medium ${
            activeTab === 'general'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          ⚙️ General Settings
        </button>
        <button
          onClick={() => setActiveTab('brand')}
          className={`font-mono text-[11px] uppercase tracking-wider pb-3 border-b-2 transition-all cursor-pointer min-h-[40px] px-2 font-medium ${
            activeTab === 'brand'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          🏬 Brand &amp; Storefront
        </button>
      </div>

      {/* General Settings Tab Content */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* PWA App Installation Section */}
          <div className="bg-surface border border-border shadow-sm p-8 rounded-sm">
            <h2 className="font-serif text-[20px] text-primary mb-2">Install App</h2>
            <p className="font-body text-[13px] text-muted mb-6">
              Install the James & Sons Admin portal on your device for quick access, offline mode, and push notifications.
            </p>
            <div className="max-w-sm">
              <PWAInstallButton />
            </div>
          </div>

          {/* Profile info */}
          <div className="bg-surface border border-border shadow-sm p-8 rounded-sm">
            <h2 className="font-serif text-[20px] text-primary mb-6">Profile Information</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-2xl">
              <div className="space-y-2">
                <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">Full Name</label>
                <input
                  type="text"
                  defaultValue={userFullName}
                  className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">Email Address</label>
                <input
                  type="email"
                  defaultValue={userEmail}
                  className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent rounded-sm"
                  disabled
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block">Role</label>
                <input
                  type="text"
                  defaultValue="System Administrator"
                  className="w-full bg-surface-muted border border-border px-4 py-3 text-secondary font-body text-[14px] cursor-not-allowed rounded-sm"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* System Admin */}
          <div className="bg-surface border border-border shadow-sm p-8 rounded-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-[20px] text-primary">System Administration</h2>
            </div>
            <p className="font-body text-[13px] text-muted mb-6">
              Invite new staff members, assign roles, and revoke access for internal users.
            </p>
            <a
              href="/account/manage-admins"
              className="btn-outline inline-block text-center font-mono text-[10px] uppercase tracking-[0.1em] px-6 py-3 rounded-sm"
            >
              Manage Administrators →
            </a>
          </div>
        </div>
      )}

      {/* Brand Config Tab Content */}
      {activeTab === 'brand' && (
        <BrandSettingsForm initialConfig={brandConfig} />
      )}
    </div>
  );
}
