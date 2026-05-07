import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Buck — Stop working. Start sleeping.',
  description:
    'An overnight autonomous agent that runs in a sandbox, keeps a diary, and proposes improvements to itself.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Buck — Stop working. Start sleeping.',
    description: 'Hand him a task list at bedtime. Wake up to a diary.',
    images: ['/buck-mark.svg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}