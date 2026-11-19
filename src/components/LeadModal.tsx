'use client';

import React, { useState } from 'react';
import { Lead, LeadCategory } from '@/lib/types';
import { generateSlug } from '@/lib/scripts-engine';
import { X, Plus, Sparkles } from 'lucide-react';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  onAddLead,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<LeadCategory>('spa');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [managerName, setManagerName] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Vui lòng nhập Tên cơ sở và Số điện thoại');
      return;
    }

    const demoSlug = generateSlug(name) || 'tiem-dich-vu';

    onAddLead({
      name: name.trim(),
      category,
      phone: phone.trim(),
      location: location.trim() || 'Chưa cập nhật',
      managerName: managerName.trim() || 'Quản lý',
      status: 'new',
      demoSlug,
      notes: notes.trim(),
    });

    // Reset form
    setName('');
    setPhone('');
    setLocation('');
    setManagerName('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
              <Plus className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Thêm Khách Hàng Tiềm Năng
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tên tiệm / Cơ sở kinh doanh <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: SeoulSpa Quận 10, Nha Khoa Kim..."
              className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ngành nghề <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LeadCategory)}
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="spa">Spa / Thẩm Mỹ</option>
                <option value="dental">Nha Khoa</option>
                <option value="salon">Hair Salon / Nail</option>
                <option value="sports">Sân Pickleball / Thể thao</option>
                <option value="clinic">Phòng Khám</option>
                <option value="restaurant">Nhà Hàng / Quán Ăn</option>
                <option value="hotel">Khách Sạn / Homestay</option>
                <option value="other">Ngành khác</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Số Zalo / Điện thoại <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0901234567"
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Người phụ trách / Chủ tiệm
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="VD: Chị Thảo, Bác sĩ Minh..."
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Khu vực / Quận Huyện
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="VD: Quận 3, TP.HCM"
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Ghi chú về khách (Nỗi đau, thói quen...)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Khách đông thứ 7, CN; rất ghét khách đặt rồi hủy..."
              className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>Hệ thống sẽ tự động tạo đường link Web Demo cá nhân hóa trên App 1 tương ứng với tên tiệm này.</span>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition"
            >
              Lưu Khách Hàng
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
