import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI News Companion',
  description: 'Global conversational AI news podcast companion'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
