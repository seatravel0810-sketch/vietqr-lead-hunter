'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Target, MessageSquare, BarChart3, ExternalLink } from 'lucide-react';
import { APP1_BASE_URL } from '@/lib/scripts-engine';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Săn Khách', href: '/', icon: <Target className="w-5 h-5" /> },
    { label: 'Kịch Bản', href: '/scripts', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'Báo Cáo', href: '/stats', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around max-w-lg mx-auto sm:rounded-t-2xl sm:shadow-lg">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
              isActive
                ? 'text-blue-600 font-bold'
                : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            {item.icon}
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}

      <a
        href={APP1_BASE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-blue-600 font-medium transition"
        title="Mở App 1 (VietQR Booking) trên tab mới"
      >
        <ExternalLink className="w-5 h-5" />
        <span className="text-[10px]">App 1</span>
      </a>
    </nav>
  );
};
