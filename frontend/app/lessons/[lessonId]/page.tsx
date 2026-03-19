import LessonDetailClient from './LessonDetailClient';

export function generateStaticParams() {
  return [{ lessonId: '1' }];
}

export default function LessonDetailPage() {
  return <LessonDetailClient />;
}
