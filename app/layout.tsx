import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Cascada Coagulării – Model Didactic',
  description: 'Simulator interactiv al cascadei de coagulare pentru învățământ medical',
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
