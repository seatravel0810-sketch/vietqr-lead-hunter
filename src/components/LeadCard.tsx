'use client';

import React from 'react';
import { Lead, LeadStatus, LeadCategory } from '@/lib/types';
import { getDemoUrl } from '@/lib/scripts-engine';
import { 
  Sparkles, 
  Smile, 
  Scissors, 
  Trophy, 
  Stethoscope, 
  Building2, 
  Phone, 
  MapPin, 
  ExternalLink, 
  MessageCircle, 
  Trash2,
  ChevronDown,
  Utensils,
  Hotel
} from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onOpenOutreach: (lead: Lead) => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_CONFIG: Record<LeadCategory, { label: string; icon: React.ReactNode; bg: string; color: string }> = {
  spa: { label: 'Spa / Thẩm Mỹ', icon: <Sparkles className="w-4 h-4" />, bg: 'bg-rose-50', color: 'text-rose-600' },
  dental: { label: 'Nha Khoa', icon: <Smile className="w-4 h-4" />, bg: 'bg-cyan-50', color: 'text-cyan-600' },
  salon: { label: 'Hair Salon', icon: <Scissors className="w-4 h-4" />, bg: 'bg-amber-50', color: 'text-amber-600' },
  sports: { label: 'Sân Thể Thao', icon: <Trophy className="w-4 h-4" />, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  clinic: { label: 'Phòng Khám', icon: <Stethoscope className="w-4 h-4" />, bg: 'bg-indigo-50', color: 'text-indigo-600' },
  restaurant: { label: 'Nhà Hàng / Quán Ăn', icon: <Utensils className="w-4 h-4" />, bg: 'bg-orange-50', color: 'text-orange-600' },
  hotel: { label: 'Khách Sạn / Lưu Trú', icon: <Hotel className="w-4 h-4" />, bg: 'bg-blue-50', color: 'text-blue-600' },
  other: { label: 'Dịch Vụ Khác', icon: <Building2 className="w-4 h-4" />, bg: 'bg-slate-50', color: 'text-slate-600' },
};

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string; border: string }> = {
  new: { label: '🟡 Mới tìm được', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  contacted: { label: '🔵 Đã gửi Zalo', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  viewed_demo: { label: '🟣 Đã xem Demo', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  negotiating: { label: '🟠 Đang trao đổi', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  won: { label: '🟢 Đã chốt (Win)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  lost: { label: '⚪ Từ chối', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
};

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onOpenOutreach,
  onStatusChange,
  onDelete,
}) => {
  const cat = CATEGORY_CONFIG[lead.category] || CATEGORY_CONFIG.other;
  const stat = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
  const demoUrl = getDemoUrl(lead.demoSlug);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition duration-200 flex flex-col justify-between">
      <div>
        {/* Header: Category & Status */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cat.bg} ${cat.color}`}>
            {cat.icon}
            {cat.label}
          </span>

          <div className="relative">
            <select
              value={lead.status}
              onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border appearance-none pr-6 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${stat.bg} ${stat.text} ${stat.border}`}
            >
              <option value="new">🟡 Mới tìm được</option>
              <option value="contacted">🔵 Đã gửi Zalo</option>
              <option value="viewed_demo">🟣 Đã xem Demo</option>
              <option value="negotiating">🟠 Đang trao đổi</option>
              <option value="won">🟢 Đã chốt (Win)</option>
              <option value="lost">⚪ Từ chối</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-2 pointer-events-none opacity-60" />
          </div>
        </div>

        {/* Lead Name & Manager */}
        <div className="mb-2">
          <div className="flex items-center justify-between gap-1">
            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
              {lead.name}
            </h3>
            {lead.googleMapsUrl && (
              <a
                href={lead.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-emerald-600 transition shrink-0"
                title="Mở Google Maps của cơ sở này"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
              </a>
            )}
          </div>
          {lead.managerName && (
            <p className="text-xs text-slate-500 mt-0.5">
              Phụ trách: <span className="font-medium text-slate-700">{lead.managerName}</span>
            </p>
          )}
        </div>

        {/* Contact info: Phone & Address */}
        <div className="space-y-1 text-xs text-slate-600 mb-3">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800">{lead.phone}</span>
          </div>
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-1 text-slate-500">{lead.location}</span>
          </div>
        </div>

        {/* Notes (if any) */}
        {lead.notes && (
          <div className="bg-slate-50 rounded-lg p-2 text-xs text-slate-600 mb-3 border border-slate-100 italic">
            "{lead.notes}"
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <a
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
          title="Mở xem trang web demo cá nhân hóa trên App 1"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Web Demo</span>
        </a>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onOpenOutreach(lead)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm active:scale-95 transition"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Nhắn Zalo</span>
          </button>

          <button
            onClick={() => {
              if (confirm(`Xóa khách hàng "${lead.name}"?`)) {
                onDelete(lead.id);
              }
            }}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"
            title="Xóa khách này"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
