import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact Concierge | James & Sons',
  description: 'Reach our luxury illumination customer service and design desks at Mohalla Peer Mattha, Aligarh. Access tickets or launch our live chat help desk.',
};

export default function ContactPage() {
  return (
    <>
      <Navigation />
      <main style={{ minHeight: '100vh', background: 'var(--obsidian)' }}>
        <ContactClient />
      </main>
    </>
  );
}
