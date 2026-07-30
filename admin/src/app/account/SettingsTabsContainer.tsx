'use client';

import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import PWAInstallButton from '@/components/PWAInstallButton';
import BrandSettingsForm from './BrandSettingsForm';
import { adminTogglePagePublishStatus } from './config-actions';

interface PageItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SettingsTabsContainerProps {
  userEmail: string;
  userFullName: string;
  brandConfig: any;
  initialPages: PageItem[];
}

export default function SettingsTabsContainer({
  userEmail,
  userFullName,
  brandConfig,
  initialPages,
}: SettingsTabsContainerProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'brand' | 'pages'>('general');
  const [pages, setPages] = useState<PageItem[]>(initialPages);
  const [isPending, startTransition] = useTransition();

  // Search & Filter state for CMS pages
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  // Sync pages state if server revalidates
  useMemo(() => {
    setPages(initialPages);
  }, [initialPages]);

  const handleTogglePublish = (pageId: string, currentStatus: boolean) => {
    startTransition(async () => {
      try {
        await adminTogglePagePublishStatus(pageId, currentStatus);
        setPages(prev =>
          prev.map(p => (p.id === pageId ? { ...p, isPublished: !currentStatus } : p))
        );
      } catch (err) {
        console.error('Failed to toggle publish status:', err);
      }
    });
  };

  // Filter & Search Logic
  const filteredPages = useMemo(() => {
    return pages.filter(p => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PUBLISHED' && p.isPublished) ||
        (statusFilter === 'DRAFT' && !p.isPublished);

      return matchesSearch && matchesStatus;
    });
  }, [pages, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Tabs Selector Bar */}
      <div className="flex border-b border-border gap-4 shrink-0 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('general')}
          className={`font-mono text-[11px] uppercase tracking-wider pb-3 border-b-2 transition-all cursor-pointer min-h-[40px] px-2 whitespace-nowrap font-medium ${
            activeTab === 'general'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          ⚙️ General Settings
        </button>
        <button
          onClick={() => setActiveTab('brand')}
          className={`font-mono text-[11px] uppercase tracking-wider pb-3 border-b-2 transition-all cursor-pointer min-h-[40px] px-2 whitespace-nowrap font-medium ${
            activeTab === 'brand'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          🏬 Brand &amp; Storefront
        </button>
        <button
          onClick={() => setActiveTab('pages')}
          className={`font-mono text-[11px] uppercase tracking-wider pb-3 border-b-2 transition-all cursor-pointer min-h-[40px] px-2 whitespace-nowrap font-medium ${
            activeTab === 'pages'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          📄 Pages / CMS
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

      {/* Pages / CMS Tab Content */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-surface p-6 border border-border rounded-sm">
            <div>
              <h2 className="font-serif text-[24px] font-normal text-primary tracking-wide m-0">
                CMS Pages Management
              </h2>
              <p className="font-body text-muted text-[13px] mt-1 m-0">
                Create static informational pages like terms, about, or return policies for the storefront.
              </p>
            </div>
            <div>
              <Link
                href="/pages/new"
                className="font-mono text-[10px] uppercase tracking-[0.12em] bg-accent text-background px-5 py-2.5 hover:bg-accent-hover transition-colors rounded-sm cursor-pointer font-semibold shadow-lg shadow-accent/20"
              >
                + Create New Page
              </Link>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="premium-card p-4 rounded-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex-1 flex items-center gap-2 border border-border bg-background px-3 py-2.5 rounded-sm focus-within:border-accent min-w-[280px]">
              <span className="text-muted text-xs">🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search pages by title or slug mapping..."
                className="bg-transparent text-primary font-mono text-[12px] focus:outline-none w-full placeholder:text-muted/60"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-muted hover:text-primary font-mono text-[10px] uppercase"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted">Status</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2.5 border border-border bg-background text-secondary font-mono text-[11px] uppercase tracking-wider focus:outline-none focus:border-accent transition-colors cursor-pointer rounded-sm"
              >
                <option value="ALL">All States</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          {/* Pages Table */}
          <div className="premium-card flex flex-col overflow-hidden rounded-sm">
            {filteredPages.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-[32px] mb-3 opacity-60">📄</div>
                <h3 className="font-serif text-[16px] text-primary mb-1">No Pages Found</h3>
                <p className="font-body text-muted text-[13px] max-w-sm mx-auto">
                  No pages matching the query rules are currently configured in this store.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 bg-surface-muted/40 font-mono text-[10px] uppercase tracking-wider text-muted">
                      <th className="px-8 py-4 font-semibold">Title</th>
                      <th className="px-8 py-4 font-semibold">Slug Mapping</th>
                      <th className="px-8 py-4 font-semibold">Visibility</th>
                      <th className="px-8 py-4 font-semibold">Last Updated</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredPages.map(page => {
                      const storefrontUrl = `${
                        brandConfig.storefrontUrl || 'https://jamesandsons.in'
                      }/${page.slug}`;

                      return (
                        <tr key={page.id} className="hover:bg-surface-muted/15 transition-colors">
                          <td className="px-8 py-5">
                            <Link href={`/pages/${page.id}`}>
                              <span className="font-serif text-[16px] text-primary hover:text-accent cursor-pointer transition-colors">
                                {page.title}
                              </span>
                            </Link>
                          </td>
                          <td className="px-8 py-5 font-mono text-[11px] text-muted">
                            /{page.slug}
                          </td>
                          <td className="px-8 py-5">
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(page.id, page.isPublished)}
                              disabled={isPending}
                              className={`font-mono text-[9px] uppercase tracking-wider border px-3 py-1 rounded-full cursor-pointer transition-colors ${
                                page.isPublished
                                  ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10 hover:bg-emerald-950/20'
                                  : 'text-amber-500 border-amber-500/30 bg-amber-500/10 hover:bg-amber-950/20'
                              }`}
                            >
                              {page.isPublished ? 'Published' : 'Draft'}
                            </button>
                          </td>
                          <td className="px-8 py-5 font-mono text-[12px] text-secondary">
                            {new Date(page.updatedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end items-center gap-4">
                              <Link
                                href={`/pages/${page.id}`}
                                className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted hover:text-primary transition-colors font-semibold"
                              >
                                Edit
                              </Link>
                              <a
                                href={storefrontUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent hover:text-white transition-colors"
                              >
                                View
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
