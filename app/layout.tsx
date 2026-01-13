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
  maximumScale: 1,
  userScalable: false,
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
