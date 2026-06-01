import { redirect } from 'next/navigation';

// 루트 경로에서 기본 언어(ko)로 리다이렉트
export default function RootPage() {
  redirect('/ko');
}
