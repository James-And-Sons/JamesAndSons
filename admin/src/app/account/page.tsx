import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { adminGetSystemConfig } from './config-actions';
import SettingsTabsContainer from './SettingsTabsContainer';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await requireAdmin();
  const email = user.email || '';
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
  const brandConfig = await adminGetSystemConfig('BRAND');
  
  const pages = await prisma.page.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const serializedPages = pages.map((p: any) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Settings</h1>
      </div>

      <SettingsTabsContainer 
        userEmail={email}
        userFullName={fullName}
        brandConfig={brandConfig}
        initialPages={serializedPages as any}
      />
    </div>
  );
}
