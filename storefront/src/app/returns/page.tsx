import ReturnsPortalClient from './ReturnsPortalClient';
import Navigation from '@/components/Navigation';

export const metadata = {
  title: 'Returns Portal | James & Sons',
  description: 'Submit a return or exchange request for your order.',
};

export default function ReturnsPage() {
  return (
    <>
      <Navigation />
      <ReturnsPortalClient />
    </>
  );
}
