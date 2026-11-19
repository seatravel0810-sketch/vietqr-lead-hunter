'use client';

import React, { useState, useEffect } from 'react';
import { GooglePlaceResult, Lead, LeadCategory } from '@/lib/types';
import { generateSlug } from '@/lib/scripts-engine';
import { getStoredApiKey, saveStoredApiKey } from '@/lib/storage';
import { 
  X, 
  Search, 
  MapPin, 
  Phone, 
  Star, 
  ExternalLink, 
  Sparkles, 
  Key, 
  Check, 
  Plus, 
  Loader2,
  FileJson,
  Upload,
  Terminal,
  Info
} from 'lucide-react';

interface GoogleMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLeads: (leads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

export const GoogleMapsModal: React.FC<GoogleMapsModalProps> = ({
  isOpen,
  onClose,
  onAddLeads,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'api' | 'crawler'>('import');

  // API Search State
  const [searchQuery, setSearchQuery] = useState('Spa Quận 1');
  const [apiKey, setApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<GooglePlaceResult[]>([]);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<Set<string>>(new Set());
  const [searchError, setSearchError] = useState<string | null>(null);

  // File / JSON Import State
  const [jsonInput, setJsonInput] = useState('');
  const [importedPreview, setImportedPreview] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
    }
  }, [isOpen]);

  // Handle JSON file selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonInput(content);
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          setImportedPreview(parsed);
        } else {
          alert('File JSON không đúng định dạng danh sách mảng [ ... ]');
        }
      } catch (err) {
        alert('Lỗi đọc file JSON: định dạng không hợp lệ.');
      }
    };
    reader.readAsText(file);
  };

  const handleJsonTextChange = (text: string) => {
    setJsonInput(text);
    try {
      if (!text.trim()) {
        setImportedPreview([]);
        return;
      }
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        setImportedPreview(parsed);
      }
    } catch {
      // ignore parsing while typing
    }
  };

  const handleImportJsonList = () => {
    if (importedPreview.length === 0) {
      alert('Chưa có dữ liệu hợp lệ để nạp.');
      return;
    }

    const leadsToAdd: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[] = importedPreview.map((item) => ({
      name: item.name || 'Tiệm Mới',
      category: item.category || 'spa',
      phone: item.phone || 'Chưa có SĐT',
      location: item.location || 'Chưa cập nhật địa chỉ',
      managerName: item.managerName || 'Chủ tiệm',
      status: 'new',
      demoSlug: item.demoSlug || generateSlug(item.name || 'tiem'),
      googleMapsUrl: item.googleMapsUrl || '',
      rating: item.rating,
      notes: item.notes || 'Cào từ Google Maps',
    }));

    onAddLeads(leadsToAdd);
    setJsonInput('');
    setImportedPreview([]);
    onClose();
  };

  const handleSaveApiKey = () => {
    saveStoredApiKey(apiKey);
    setIsSavingKey(true);
    setTimeout(() => setIsSavingKey(false), 2000);
  };

  const handleSearchApi = async () => {
    if (!searchQuery.trim()) {
      alert('Vui lòng nhập từ khóa tìm kiếm (VD: Spa Quận 1)');
      return;
    }

    setIsLoading(true);
    setSearchError(null);
    setSearchResults([]);
    setSelectedPlaceIds(new Set());

    try {
      const res = await fetch('/api/search-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, apiKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'NO_API_KEY') {
          setSearchError('Chưa cấu hình Google Maps API Key. Bạn hãy nhập key ở trên hoặc dùng tab "Nhập File Data Đã Cào" nhé.');
        } else {
          setSearchError(data.error || 'Có lỗi xảy ra khi tìm kiếm.');
        }
        return;
      }

      setSearchResults(data.places || []);
      const idsWithPhone = new Set<string>();
      (data.places || []).forEach((p: GooglePlaceResult) => {
        if (p.phone) idsWithPhone.add(p.placeId);
      });
      setSelectedPlaceIds(idsWithPhone);
    } catch (err: any) {
      setSearchError('Lỗi kết nối: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectPlace = (id: string) => {
    setSelectedPlaceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImportSelectedFromApi = () => {
    const toImport = searchResults.filter((p) => selectedPlaceIds.has(p.placeId));
    if (toImport.length === 0) {
      alert('Vui lòng tích chọn ít nhất 1 tiệm.');
      return;
    }

    const leadsToAdd: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[] = toImport.map((p) => ({
      name: p.name,
      category: p.category,
      phone: p.phone || 'Chưa có SĐT',
      location: p.address,
      managerName: 'Chủ tiệm',
      status: 'new',
      demoSlug: generateSlug(p.name) || 'tiem-dich-vu',
      googleMapsUrl: p.googleMapsUri,
      rating: p.rating,
      reviewCount: p.reviewCount,
      notes: `Đánh giá: ${p.rating ? p.rating + '★' : 'Chưa có'} (${p.reviewCount || 0} reviews) từ Google Maps`,
    }));

    onAddLeads(leadsToAdd);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <MapPin className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Săn Khách Thật Từ Google Maps
              </h2>
              <p className="text-xs text-slate-500">
                Tự động cào và bóc tách số điện thoại tiệm Spa, Nha khoa, Salon
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-4 pt-2">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>1. Nạp File Data Đã Cào ({importedPreview.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('crawler')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'crawler'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>2. Chạy Cào Tự Động (1-Click)</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'api'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>3. Quét Qua Google API</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
          {activeTab === 'import' ? (
            /* TAB 1: File / JSON Import */
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-400 bg-slate-50 transition">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="json-file-input"
                />
                <label
                  htmlFor="json-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-slate-800 text-sm">
                    Bấm để chọn file JSON data vừa cào
                  </p>
                  <p className="text-xs text-slate-400">
                    Hỗ trợ file <code>data_crawled.json</code> sinh ra từ công cụ cào tự động
                  </p>
                </label>
              </div>

              {importedPreview.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 text-xs sm:text-sm">
                      Đã đọc được {importedPreview.length} cơ sở từ file:
                    </span>
                    <button
                      type="button"
                      onClick={handleImportJsonList}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nạp Tất Cả {importedPreview.length} Tiệm Vào Phễu</span>
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {importedPreview.slice(0, 15).map((item, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-emerald-100 text-xs flex justify-between items-center gap-2">
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">{item.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{item.location}</p>
                        </div>
                        <span className="font-mono font-bold text-blue-600 shrink-0">{item.phone}</span>
                      </div>
                    ))}
                    {importedPreview.length > 15 && (
                      <p className="text-[11px] text-slate-400 text-center italic">
                        ... và còn {importedPreview.length - 15} cơ sở khác
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'crawler' ? (
            /* TAB 2: Automated Scraper Guide */
            <div className="space-y-4">
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 space-y-2.5 font-mono text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Terminal className="w-4 h-4" />
                  <span>CÔNG CỤ CÀO GOOGLE MAPS TỰ ĐỘNG 100% CÓ SẴN TRÊN MÁY BẠN:</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  Tôi đã tạo sẵn file chạy tự động <strong><code>Cao_Data_Google_Maps.bat</code></strong> nằm ngay trong thư mục dự án của bạn tại:
                </p>
                <div className="bg-slate-800 p-2.5 rounded-xl text-blue-300 break-all select-all">
                  D:\Replica skill\vietqr-lead-hunter\Cao_Data_Google_Maps.bat
                </div>
                <p className="text-slate-300 font-sans leading-relaxed">
                  <strong>Cách dùng siêu đơn giản (3 bước):</strong><br />
                  1. Mở thư mục <code>D:\Replica skill\vietqr-lead-hunter</code> và nhấp đúp vào <strong><code>Cao_Data_Google_Maps.bat</code></strong>.<br />
                  2. Nhập từ khóa muốn săn (Ví dụ: <em>Spa Quận 1</em> hoặc <em>Nha khoa Cầu Giấy</em>) và ấn Enter.<br />
                  3. Máy sẽ tự động mở Chromium ngầm, cào đầy đủ Tên, SĐT, Địa chỉ và lưu ra file <code>data_crawled.json</code>.<br />
                  4. Quay lại tab <strong>"1. Nạp File Data Đã Cào"</strong> ở trên để nạp vào hệ thống chỉ với 1 cú click!
                </p>
              </div>
            </div>
          ) : (
            /* TAB 3: Google Places API */
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Key className="w-4 h-4 text-amber-500" />
                    <span>Google Maps API Key:</span>
                  </div>
                  <a
                    href="https://console.cloud.google.com/google/maps-apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Lấy key chính thức</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Nhập API Key để gọi trực tiếp"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shrink-0 transition"
                  >
                    {isSavingKey ? 'Đã lưu!' : 'Lưu Key'}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchApi()}
                    placeholder="VD: Spa Quận 1, Nha khoa Cầu Giấy..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearchApi}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shrink-0 shadow-md active:scale-95 transition flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang quét...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Quét Tiệm</span>
                    </>
                  )}
                </button>
              </div>

              {searchError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div>{searchError}</div>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>
                      Tìm thấy <strong className="text-slate-900">{searchResults.length}</strong> cơ sở thật:
                    </span>
                    <span>
                      Đã chọn: <strong className="text-blue-600">{selectedPlaceIds.size}</strong> tiệm
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {searchResults.map((place) => {
                      const isSelected = selectedPlaceIds.has(place.placeId);
                      return (
                        <div
                          key={place.placeId}
                          onClick={() => toggleSelectPlace(place.placeId)}
                          className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                            isSelected
                              ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {place.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{place.address}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                              {place.phone ? (
                                <span className="font-bold text-blue-700 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {place.phone}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Chưa có số ĐT</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleImportSelectedFromApi}
                    disabled={selectedPlaceIds.size === 0}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm {selectedPlaceIds.size} Tiệm Vào Phễu</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
