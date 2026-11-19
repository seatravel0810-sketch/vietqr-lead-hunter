'use client';

import React from 'react';
import { LeadCategory, LeadStatus } from '@/lib/types';
import { Search } from 'lucide-react';

interface PipelineFilterProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedCategory: LeadCategory | 'all';
  onCategoryChange: (cat: LeadCategory | 'all') => void;
  selectedStatus: LeadStatus | 'all';
  onStatusChange: (status: LeadStatus | 'all') => void;
  counts: {
    all: number;
    new: number;
    contacted: number;
    viewed_demo: number;
    negotiating: number;
    won: number;
  };
}

export const PipelineFilter: React.FC<PipelineFilterProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  counts,
}) => {
  const categories: { key: LeadCategory | 'all'; label: string }[] = [
    { key: 'all', label: 'Tất cả ngành' },
    { key: 'spa', label: 'Spa / Thẩm Mỹ' },
    { key: 'dental', label: 'Nha Khoa' },
    { key: 'salon', label: 'Hair Salon' },
    { key: 'sports', label: 'Sân Thể Thao' },
    { key: 'clinic', label: 'Phòng Khám' },
    { key: 'restaurant', label: 'Nhà Hàng' },
    { key: 'hotel', label: 'Khách Sạn' },
    { key: 'other', label: 'Dịch Vụ Khác' },
  ];

  const statuses: { key: LeadStatus | 'all'; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: counts.all },
    { key: 'new', label: 'Mới tìm', count: counts.new },
    { key: 'contacted', label: 'Đã gửi Zalo', count: counts.contacted },
    { key: 'viewed_demo', label: 'Xem Demo', count: counts.viewed_demo },
    { key: 'negotiating', label: 'Đang bàn', count: counts.negotiating },
    { key: 'won', label: 'Đã chốt (Win)', count: counts.won },
  ];

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên tiệm, số điện thoại, quận huyện..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm text-slate-800 placeholder-slate-400 shadow-sm"
        />
      </div>

      {/* Pipeline Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {statuses.map((s) => {
          const isActive = selectedStatus === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onStatusChange(s.key)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold transition shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{s.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  isActive ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {s.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Categories Horizontal Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((c) => {
          const isActive = selectedCategory === c.key;
          return (
            <button
              key={c.key}
              onClick={() => onCategoryChange(c.key)}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition shrink-0 text-xs ${
                isActive
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
