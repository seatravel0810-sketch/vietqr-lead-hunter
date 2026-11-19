import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'VietQR Lead Hunter & Sales Auto-Pilot',
  description: 'Vũ khí săn khách hàng B2B Spa, Nha khoa, Salon và bán phần mềm VietQR Booking',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LeadHunter',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased min-h-screen bg-slate-50">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
