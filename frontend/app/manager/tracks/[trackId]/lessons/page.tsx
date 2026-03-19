import LessonManagementClient from './LessonManagementClient';

export function generateStaticParams() {
  return [{ trackId: '1' }];
}

export default function LessonManagementPage() {
  return <LessonManagementClient />;
}
