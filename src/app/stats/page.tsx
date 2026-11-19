'use client';

import React, { useState, useEffect } from 'react';
import { Lead } from '@/lib/types';
import { getStoredLeads, computePipelineStats } from '@/lib/storage';
import { BarChart3, TrendingUp, DollarSign, Award, Target } from 'lucide-react';

export default function StatsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    setLeads(getStoredLeads());
  }, []);

  const stats = computePipelineStats(leads);

  // Revenue estimation (199,000 VND / month per won client)
  const monthlyRevenue = stats.won * 199000;
  const potentialRevenue = (stats.negotiating + stats.viewedDemo) * 199000;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900">
                Hiệu Suất Bán Hàng &amp; Doanh Thu
              </h1>
              <p className="text-[11px] font-medium text-slate-500">
                Theo dõi tiến độ kiếm tiền từ App 1
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 space-y-4">
        {/* Revenue Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-3xl p-5 shadow-lg shadow-emerald-500/20">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-5 h-5" />
              <span className="text-xs font-semibold text-emerald-100">Doanh Thu Thuê Bao Thực Tế (MRR)</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black mt-2">
              {monthlyRevenue.toLocaleString('vi-VN')} đ
              <span className="text-xs font-normal text-emerald-200 block sm:inline sm:ml-2">/ tháng ({stats.won} khách đã chốt)</span>
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1 text-slate-500">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-semibold">Doanh Thu Tiềm Năng Đang Đàm Phán</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {potentialRevenue.toLocaleString('vi-VN')} đ
              <span className="text-xs font-normal text-slate-400 block sm:inline sm:ml-2">/ tháng ({stats.negotiating + stats.viewedDemo} khách)</span>
            </p>
          </div>
        </div>

        {/* Funnel Progress */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-sm sm:text-base text-slate-900">
              Phễu Chuyển Đổi Thực Tế (Sales Funnel)
            </h2>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <div className="flex justify-between font-semibold mb-1 text-slate-700">
                <span>1. Tổng số khách hàng tìm được</span>
                <span>{stats.total} tiệm (100%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1 text-slate-700">
                <span>2. Đã tiếp cận gửi tin Zalo</span>
                <span>{stats.contacted} tiệm ({stats.total > 0 ? Math.round((stats.contacted / stats.total) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-sky-500 h-full rounded-full" 
                  style={{ width: `${stats.total > 0 ? (stats.contacted / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1 text-slate-700">
                <span>3. Đã click xem Web Demo App 1</span>
                <span>{stats.viewedDemo} tiệm ({stats.total > 0 ? Math.round((stats.viewedDemo / stats.total) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-500 h-full rounded-full" 
                  style={{ width: `${stats.total > 0 ? (stats.viewedDemo / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1 text-slate-700">
                <span>4. Đang trao đổi &amp; báo giá</span>
                <span>{stats.negotiating} tiệm ({stats.total > 0 ? Math.round((stats.negotiating / stats.total) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-orange-500 h-full rounded-full" 
                  style={{ width: `${stats.total > 0 ? (stats.negotiating / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1 text-emerald-700">
                <span>5. Đã chốt hợp đồng (Thành công)</span>
                <span className="font-bold">{stats.won} tiệm ({stats.conversionRate}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${stats.conversionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Card */}
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-3.5">
          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 text-sm">Cột Mốc Tiếp Theo: 50 Khách Trả Phí</h3>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Mỗi ngày bạn chỉ cần gửi tin Zalo tới 10 tiệm Spa/Nha khoa có link demo. Với tỷ lệ chuyển đổi trung bình 5-10%, sau 1 tháng bạn sẽ có khoảng 20 - 30 tiệm trả phí đều đặn, đạt mốc 4.000.000 - 6.000.000đ/tháng tiền bản quyền phần mềm!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
