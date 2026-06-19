import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Pinch-zoom is left enabled for accessibility (WCAG 1.4.4). The cascade canvas
  // manages its own gesture zoom via touch-action:none, so page zoom does not conflict.
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Calculator și simulator hemostază @ Dr. Chiper',
  description: 'Simulator interactiv al cascadei de coagulare pentru învățământ medical',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HemoSim',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="ro" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
