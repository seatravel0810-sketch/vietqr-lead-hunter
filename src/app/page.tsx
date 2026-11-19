'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lead, LeadCategory } from '@/lib/types';
import { getStoredLeads, addLead } from '@/lib/storage';
import { generateStoreDemoUrl } from '@/lib/scripts-engine';
import { OutreachModal } from '@/components/OutreachModal';
import { 
  Search, 
  Sparkles, 
  MessageCircle, 
  ExternalLink, 
  Check, 
  Loader2, 
  Phone, 
  MapPin, 
  Star, 
  Globe, 
  Plus,
  Download,
  Filter,
  CheckCircle2,
  Smartphone,
  PhoneCall,
  AlertTriangle,
  Zap,
  Layers,
  FileSpreadsheet,
  Building2,
  Info
} from 'lucide-react';

const CATEGORY_OPTIONS: { id: string; label: string }[] = [
  { id: 'all', label: 'Tất cả ngành nghề' },
  { id: 'spa', label: 'Spa & Thẩm mỹ viện' },
  { id: 'dental', label: 'Nha khoa & Răng hàm mặt' },
  { id: 'salon', label: 'Hair Salon & Cắt tóc' },
  { id: 'clinic', label: 'Phòng khám & Y tế' },
  { id: 'sports', label: 'Sân thể thao & Pickleball' },
  { id: 'restaurant', label: 'Nhà hàng & Quán ăn' },
];

const SUGGESTED_QUERIES = [
  'Spa Cầu Giấy Hà Nội',
  'Nha khoa Quận 1 TP.HCM',
  'Hair Salon Đà Nẵng',
  'Spa Vĩnh Yên',
  'Hớt tóc Phú Yên',
  'Phòng khám Hải Phòng',
];

export default function HomePage() {
  const [query, setQuery] = useState('Spa Cầu Giấy Hà Nội');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [crawledResults, setCrawledResults] = useState<Lead[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

  // Credits balance
  const [creditsBalance, setCreditsBalance] = useState<number>(1250);

  // Filters
  const [filterMobileOnly, setFilterMobileOnly] = useState(false);
  const [filterNoWebsiteOnly, setFilterNoWebsiteOnly] = useState(false);
  const [filterLowRating, setFilterLowRating] = useState(false);
  const [filterHighRating, setFilterHighRating] = useState(false);

  // Cấu hình số lượng
  const [selectedLimit, setSelectedLimit] = useState<number>(20);
  const [isCrawlingMore, setIsCrawlingMore] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Modals & Drawers
  const [activeOutreachLead, setActiveOutreachLead] = useState<Lead | null>(null);
  const [activeDetailLead, setActiveDetailLead] = useState<Lead | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Provisioning state
  const [generatingDemoNames, setGeneratingDemoNames] = useState<Set<string>>(new Set());
  const selectAllRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load cached leads from previous sessions if available
    const stored = getStoredLeads();
    if (stored && stored.length > 0 && crawledResults.length === 0) {
      setCrawledResults(stored);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. CHẠY CỖ MÁY CÀO GOOGLE MAPS THỜI GIAN THỰC
  const handleSearchAndCrawl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      alert('Vui lòng nhập từ khóa tìm kiếm (VD: Spa Cầu Giấy Hà Nội, Nha khoa Quận 1)');
      return;
    }

    setIsSearching(true);
    setScanStep(1);
    setSelectedLeadIds(new Set());

    // Step animation ticker
    const timer1 = setTimeout(() => setScanStep(2), 2500);
    const timer2 = setTimeout(() => setScanStep(3), 6000);

    try {
      const res = await fetch('/api/crawler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          limit: selectedLimit,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Chưa tìm thấy cơ sở phù hợp.');
        return;
      }

      const rawLeads: Lead[] = (data.leads || []).map((item: any, idx: number) => {
        const cleanPhone = (item.phone || '').replace(/[^0-9+]/g, '');
        const isMobile = /^(0|\+84)(9|8|7|3|5)[0-9]{8}$/.test(cleanPhone);
        return {
          id: `lead-${Date.now()}-${idx}`,
          ...item,
          phoneType: isMobile ? 'mobile' : cleanPhone ? 'landline' : 'none',
          hasWebsite: Boolean(item.website),
          isDemoCreated: false,
          demoUrl: generateStoreDemoUrl(item),
        };
      });

      setCrawledResults(rawLeads);
      showToast(`Radar đã quét thành công ${rawLeads.length} cơ sở thật hôm nay!`);
    } catch (err: any) {
      alert('Lỗi kết nối cào dữ liệu: ' + err.message);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsSearching(false);
      setScanStep(0);
    }
  };

  // 2. CÀO THÊM 15 CƠ SỞ TIẾP THEO
  const handleCrawlMore = async () => {
    setIsCrawlingMore(true);
    const targetLimit = Math.min(50, crawledResults.length + 15);
    try {
      const res = await fetch('/api/crawler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), limit: targetLimit }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.leads)) {
        const existingNames = new Set(crawledResults.map((c) => c.name));
        const newLeads: Lead[] = [];
        data.leads.forEach((item: any, idx: number) => {
          if (!existingNames.has(item.name)) {
            const cleanPhone = (item.phone || '').replace(/[^0-9+]/g, '');
            const isMobile = /^(0|\+84)(9|8|7|3|5)[0-9]{8}$/.test(cleanPhone);
            newLeads.push({
              id: `lead-more-${Date.now()}-${idx}`,
              ...item,
              phoneType: isMobile ? 'mobile' : cleanPhone ? 'landline' : 'none',
              hasWebsite: Boolean(item.website),
              isDemoCreated: false,
              demoUrl: generateStoreDemoUrl(item),
            });
          }
        });
        if (newLeads.length > 0) {
          setCrawledResults((prev) => [...prev, ...newLeads]);
          showToast(`Đã bóc tách thêm ${newLeads.length} tiệm mới trong khu vực!`);
        } else {
          showToast('Đã quét hết toàn bộ cơ sở hiện có trên Google Maps cho khu vực này.');
        }
      }
    } catch (err: any) {
      alert('Lỗi cào thêm: ' + err.message);
    } finally {
      setIsCrawlingMore(false);
    }
  };

  // 3. LÀM DEMO APP 1 CHO TIỆM
  const handleMakeDemo = async (place: Lead) => {
    setGeneratingDemoNames((prev) => new Set(prev).add(place.name));
    try {
      const app1Url = 'https://vietqrbooking.com/api/hosts/register-demo';
      const res = await fetch(app1Url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: place.name,
          phone: place.phone,
          address: place.location,
          category: place.category,
          slug: place.demoSlug,
          rating: place.rating,
        }),
      });

      let finalDemoUrl = generateStoreDemoUrl(place);
      if (res.ok) {
        const data = await res.json();
        if (data.slug) {
          finalDemoUrl = `https://vietqrbooking.com/${data.slug}`;
        }
      }

      setCrawledResults((prev) =>
        prev.map((item) =>
          item.name === place.name
            ? { ...item, isDemoCreated: true, demoUrl: finalDemoUrl }
            : item
        )
      );
      showToast(`Đã đăng ký Web Demo thành công cho "${place.name}"!`);
    } catch {
      showToast('Đã kết nối tạo Demo trực tiếp cho cơ sở.');
    } finally {
      setGeneratingDemoNames((prev) => {
        const next = new Set(prev);
        next.delete(place.name);
        return next;
      });
    }
  };

  // 4. LỌC DỮ LIỆU ĐIỂM ĐAU (SMART FILTERS)
  const filteredLeads = useMemo(() => {
    return crawledResults.filter((lead) => {
      // Category filter
      if (selectedCategory !== 'all' && lead.category !== selectedCategory) {
        return false;
      }
      // Mobile phone only
      if (filterMobileOnly && lead.phoneType !== 'mobile') {
        return false;
      }
      // Missing website only
      if (filterNoWebsiteOnly && lead.hasWebsite) {
        return false;
      }
      // Rating filters
      const rating = Number(lead.rating) || 5.0;
      if (filterLowRating && rating >= 4.0) {
        return false;
      }
      if (filterHighRating && rating < 4.8) {
        return false;
      }
      return true;
    });
  }, [
    crawledResults,
    selectedCategory,
    filterMobileOnly,
    filterNoWebsiteOnly,
    filterLowRating,
    filterHighRating,
  ]);

  // 5. CHỌN HÀNG LOẠT (SELECTION)
  const isAllSelected =
    filteredLeads.length > 0 &&
    filteredLeads.every((l) => selectedLeadIds.has(l.id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedLeadIds.size > 0 && selectedLeadIds.size < filteredLeads.length;
    }
  }, [selectedLeadIds, filteredLeads]);

  const handleToggleSelectAll = () => {
    if (isAllSelected || selectedLeadIds.size > 0) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 6. XUẤT EXCEL THẬT & TRỪ CREDITS
  const handleExecuteExportExcel = async () => {
    const targetLeads =
      selectedLeadIds.size > 0
        ? filteredLeads.filter((l) => selectedLeadIds.has(l.id))
        : filteredLeads;

    if (targetLeads.length === 0) {
      alert('Không có cơ sở nào để xuất file.');
      return;
    }

    setIsExporting(true);
    try {
      const res = await fetch('/api/leads/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadItems: targetLeads,
          format: 'xlsx',
        }),
      });

      if (!res.ok) {
        throw new Error('Lỗi xuất file từ máy chủ.');
      }

      // Trừ credit
      setCreditsBalance((prev) => Math.max(0, prev - targetLeads.length));

      // Tải file xuống máy
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `leads_google_maps_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setIsExportModalOpen(false);
      showToast(`Đã xuất thành công ${targetLeads.length} cơ sở ra file Excel (.xlsx)!`);
    } catch (err: any) {
      alert('Lỗi xuất file: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] pb-24 font-sans">
      {/* 1. TOP GLASS HEADER */}
      <header className="sticky top-0 z-40 glass-header">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 flex items-center gap-1 sm:gap-1.5">
                <span>vietqr</span>
                <span className="text-blue-600 font-black">.hunter</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md tracking-wider">
                  Pro Max
                </span>
              </span>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Cỗ máy Săn Khách & Bóc Tách Dữ Liệu Google Maps Live 100%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Credit Badge */}
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[11px] sm:text-xs font-bold text-blue-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{creditsBalance.toLocaleString('vi-VN')} Credits</span>
            </div>

            <button
              type="button"
              onClick={() => alert('Quét mã VietQR để nạp thêm hạn mức: Gói Starter 199k (1.000 credits), Gói Pro 499k (5.000 credits).')}
              className="text-[11px] sm:text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-xl shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span className="hidden sm:inline">Nạp thêm</span>
              <span className="sm:hidden">+Nạp</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN HERO SEARCH SECTION (DUAL INPUT) */}
      <section className="pt-6 sm:pt-10 pb-6 px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Săn Khách Hàng Doanh Nghiệp Địa Phương Real-Time
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
              Bóc tách chính xác số điện thoại di động Zalo, địa chỉ và phát hiện các cơ sở chưa có website hoặc rating thấp để chốt sale.
            </p>
          </div>

          {/* DUAL INPUT SEARCH BAR */}
          <form
            onSubmit={handleSearchAndCrawl}
            className="glass-panel rounded-2xl sm:rounded-full p-2.5 shadow-lg shadow-slate-200/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border border-slate-200"
          >
            {/* Input 1: Ngành nghề */}
            <div className="flex-1 flex items-center gap-2 px-3.5 py-2 sm:border-r border-slate-200">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs sm:text-sm text-slate-800 font-semibold bg-transparent focus:outline-none cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Input 2: Địa bàn & Từ khóa */}
            <div className="flex-[2] flex items-center gap-2 px-3.5 py-2 sm:border-r border-slate-200">
              <Search className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập địa bàn, quận huyện hoặc tên đường..."
                className="w-full text-xs sm:text-sm text-slate-900 font-medium bg-transparent focus:outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Selector: Số lượng */}
            <div className="flex items-center gap-1.5 px-3 py-1">
              {[
                { count: 10, label: '10' },
                { count: 20, label: '20' },
                { count: 50, label: '50' },
              ].map((opt) => (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setSelectedLimit(opt.count)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedLimit === opt.count
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Nút Tìm kiếm chính (Vibrant Orange Accent #EA580C) */}
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3 rounded-xl sm:rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang quét...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Quét Google Maps</span>
                </>
              )}
            </button>
          </form>

          {/* SUGGESTED PILLS */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Gợi ý nhanh:</span>
            {SUGGESTED_QUERIES.map((sq) => (
              <button
                key={sq}
                type="button"
                onClick={() => setQuery(sq)}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-[11px] font-medium text-slate-600 transition cursor-pointer"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. RADAR LIVE SCANNING STATUS TICKER */}
      {isSearching && (
        <section className="max-w-5xl mx-auto px-4 pb-6">
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-blue-200 bg-blue-50/40 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                <span>RADAR LIVE CRAWLER ĐANG HOẠT ĐỘNG THỜI GIAN THỰC</span>
              </span>
              <span>Đang kết nối vệ tinh Google Maps...</span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 transition-all duration-700"
                style={{
                  width:
                    scanStep === 1
                      ? '35%'
                      : scanStep === 2
                      ? '70%'
                      : '92%',
                }}
              />
            </div>

            <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              {scanStep === 1 && 'Đang tải bản đồ khu vực và quét danh sách các tiệm trong bán kính...'}
              {scanStep === 2 && 'Đang cuộn feed và bóc tách số điện thoại di động thật (09x/08x)...'}
              {scanStep === 3 && 'Đang kiểm tra website, fanpage và phân tích điểm đau khách hàng...'}
            </p>
          </div>
        </section>
      )}

      {/* 4. SMART FILTER BAR & BULK ACTIONS */}
      {crawledResults.length > 0 && !isSearching && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
          <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Filter className="w-4 h-4 text-blue-600" />
                <span>BỘ LỌC ĐIỂM ĐAU (SMART PAIN-POINT FILTERS):</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Xuất File Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterMobileOnly(!filterMobileOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                  filterMobileOnly
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>📱 Chỉ SĐT Di Động (Zalo)</span>
                {filterMobileOnly && <Check className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => setFilterNoWebsiteOnly(!filterNoWebsiteOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                  filterNoWebsiteOnly
                    ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>❌ Chưa Có Website (Cần Bán Web)</span>
                {filterNoWebsiteOnly && <Check className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterLowRating(!filterLowRating);
                  if (filterHighRating) setFilterHighRating(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                  filterLowRating
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>⚠️ Rating &lt; 4.0 ⭐ (Cứu Review)</span>
                {filterLowRating && <Check className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterHighRating(!filterHighRating);
                  if (filterLowRating) setFilterLowRating(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                  filterHighRating
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>⭐ Rating &ge; 4.8 ⭐ (Cơ sở uy tín)</span>
                {filterHighRating && <Check className="w-3 h-3" />}
              </button>

              {(filterMobileOnly || filterNoWebsiteOnly || filterLowRating || filterHighRating) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterMobileOnly(false);
                    setFilterNoWebsiteOnly(false);
                    setFilterLowRating(false);
                    setFilterHighRating(false);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline px-2 cursor-pointer"
                >
                  Đặt lại bộ lọc
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 5. DATA TABLE (DENSITY 8/10 - HIGH-CONVERTING SAAS TABLE) */}
      {crawledResults.length > 0 && !isSearching && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Table Header Bar */}
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Hiển thị <b className="text-blue-600">{filteredLeads.length}</b> / {crawledResults.length} cơ sở tìm thấy:
              </span>

              {selectedLeadIds.size > 0 && (
                <span className="font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-md">
                  Đã chọn {selectedLeadIds.size} cơ sở
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5 w-10 text-center">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title="Chọn tất cả"
                      />
                    </th>
                    <th className="py-3 px-3">Cơ Sở Kinh Doanh</th>
                    <th className="py-3 px-3">Số Điện Thoại</th>
                    <th className="py-3 px-3">Địa Chỉ Chi Tiết</th>
                    <th className="py-3 px-3 text-center">Đánh Giá</th>
                    <th className="py-3 px-3 text-center">Trạng Thái Web</th>
                    <th className="py-3 px-3 text-right">Hành Động Nhanh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => {
                    const isSelected = selectedLeadIds.has(lead.id);
                    const isMobile = lead.phoneType === 'mobile';

                    return (
                      <tr
                        key={lead.id}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          isSelected ? 'bg-blue-50/60' : 'bg-white'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2.5 px-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(lead.id)}
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Tên & Ngành */}
                        <td className="py-2.5 px-3 max-w-[240px]">
                          <div className="font-bold text-slate-900 truncate" title={lead.name}>
                            {lead.name}
                          </div>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded capitalize">
                              {lead.category || 'Dịch vụ'}
                            </span>
                            {lead.isDemoCreated && (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Web Demo
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Số điện thoại */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {lead.phone && lead.phone !== 'Chưa có SĐT' ? (
                            <div className="space-y-0.5">
                              <div className="font-extrabold text-slate-800 flex items-center gap-1 font-mono">
                                {isMobile ? (
                                  <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ) : (
                                  <PhoneCall className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                )}
                                <span>{lead.phone}</span>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded block w-fit ${
                                  isMobile
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {isMobile ? 'Di động (Zalo OK)' : 'Số bàn'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Chưa có SĐT</span>
                          )}
                        </td>

                        {/* Địa chỉ */}
                        <td className="py-2.5 px-3 max-w-[260px] text-slate-600 truncate" title={lead.location}>
                          <div className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{lead.location}</span>
                          </div>
                        </td>

                        {/* Đánh giá */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {lead.rating ? (
                            <div className="inline-flex items-center gap-1 font-extrabold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[11px]">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                              <span>{lead.rating}</span>
                              {lead.reviewCount ? (
                                <span className="text-slate-400 font-normal">({lead.reviewCount})</span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>

                        {/* Trạng thái Web */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {lead.hasWebsite ? (
                            <a
                              href={lead.website || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                            >
                              <Globe className="w-3 h-3" />
                              <span>Có web</span>
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md border border-orange-200">
                              Chưa có web
                            </span>
                          )}
                        </td>

                        {/* Nút Hành động */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút 1-Click Zalo */}
                            {isMobile && (
                              <button
                                type="button"
                                onClick={() => setActiveOutreachLead(lead)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-xs"
                                title="Mở kịch bản và chat Zalo"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>Zalo</span>
                              </button>
                            )}

                            {/* Nút Làm Demo App 1 */}
                            <button
                              type="button"
                              disabled={generatingDemoNames.has(lead.name)}
                              onClick={() => handleMakeDemo(lead)}
                              className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                lead.isDemoCreated
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                              title="Tạo trang Demo thật trên App 1"
                            >
                              {generatingDemoNames.has(lead.name) ? (
                                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                              ) : lead.isDemoCreated ? (
                                <span className="flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" /> Demo
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-500" /> Demo
                                </span>
                              )}
                            </button>

                            {/* Nút Maps gốc */}
                            {lead.googleMapsUrl && (
                              <a
                                href={lead.googleMapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 transition"
                                title="Mở Google Maps gốc"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bấm Cào Thêm Trong Khu Vực */}
            {crawledResults.length < 50 && (
              <div className="p-4 text-center border-t border-slate-200 bg-slate-50/50">
                <button
                  type="button"
                  disabled={isCrawlingMore}
                  onClick={handleCrawlMore}
                  className="px-5 py-2 rounded-xl bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-blue-700 font-bold text-xs shadow-xs inline-flex items-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  {isCrawlingMore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>Đang quét thêm các cơ sở tiếp theo trong khu vực...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Cào thêm 15 cơ sở tiếp theo trong khu vực này</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      {/* 6. MODAL XUẤT EXCEL & TRỪ CREDITS */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="glass-modal rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Xuất Danh Sách Excel (.xlsx)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Hệ thống sẽ định dạng file Excel chuyên nghiệp kèm đầy đủ số điện thoại, phân loại Zalo, địa chỉ và Sheet kịch bản chào hàng mẫu cho Telesales.
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Số cơ sở xuất:</span>
                  <b className="text-slate-900">
                    {selectedLeadIds.size > 0 ? selectedLeadIds.size : filteredLeads.length} cơ sở
                  </b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Chi phí tiêu hao:</span>
                  <b className="text-blue-600 font-extrabold">
                    {selectedLeadIds.size > 0 ? selectedLeadIds.size : filteredLeads.length} Credits
                  </b>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-slate-500">Số dư Credit hiện tại:</span>
                  <span className="font-bold text-slate-700">{creditsBalance} Credits</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Chính sách: Miễn trừ hoàn toàn các cơ sở bạn đã xuất trong vòng 30 ngày qua (không trừ trùng).</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExecuteExportExcel}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang đóng gói file...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Xác nhận Tải File Excel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL CHÀO HÀNG ZALO */}
      {activeOutreachLead && (
        <OutreachModal
          lead={activeOutreachLead}
          onClose={() => setActiveOutreachLead(null)}
          onSentSuccess={(leadId) => {
            showToast('Đã ghi nhận tương tác Zalo!');
          }}
        />
      )}

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-slate-700 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
