import TrackDetailClient from './TrackDetailClient';

export function generateStaticParams() {
  return [{ trackId: '1' }];
}

export default function TrackDetailPage() {
  return <TrackDetailClient />;
}
