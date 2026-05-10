import TrackSearchClient from './TrackSearchClient';
import Navigation from '@/components/Navigation';

export default function TrackSearchPage() {
  return (
    <>
      <Navigation />
      <TrackSearchClient />
    </>
  );
}

export const metadata = {
  title: 'Track Your Order | James & Sons',
  description: 'Follow the journey of your James & Sons masterpieces.',
};
