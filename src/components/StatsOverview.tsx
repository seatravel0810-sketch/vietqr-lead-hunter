'use client';

import React from 'react';
import { PipelineStats } from '@/lib/types';
import { Users, Send, Eye, CheckCircle2 } from 'lucide-react';

interface StatsOverviewProps {
  stats: PipelineStats;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500">Tổng Khách</p>
          <p className="text-lg font-black text-slate-900">{stats.total}</p>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl shrink-0">
          <Send className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500">Đã Gửi Zalo</p>
          <p className="text-lg font-black text-sky-700">{stats.contacted}</p>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl shrink-0">
          <Eye className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500">Đã Xem Demo</p>
          <p className="text-lg font-black text-purple-700">{stats.viewedDemo}</p>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500">Đã Chốt (Win)</p>
          <p className="text-lg font-black text-emerald-700">
            {stats.won}{' '}
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full ml-1">
              {stats.conversionRate}%
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
