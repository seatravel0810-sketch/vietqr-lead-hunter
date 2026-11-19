'use client';

import React, { useState } from 'react';
import { OUTREACH_SCRIPTS } from '@/lib/scripts-engine';
import { LeadCategory } from '@/lib/types';
import { Copy, Check, MessageSquare, Sparkles } from 'lucide-react';

export default function ScriptsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scripts = Object.values(OUTREACH_SCRIPTS);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert('Không thể tự động copy.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900">
                Kho Kịch Bản Zalo Chốt Sale
              </h1>
              <p className="text-[11px] font-medium text-slate-500">
                Đánh trúng nỗi đau bùng cọc của từng ngành
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 space-y-4">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-5 shadow-lg shadow-blue-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-5 h-5" />
            <h2 className="font-bold text-sm sm:text-base">Công Thức Chốt Sale "1-Click Demo"</h2>
          </div>
          <p className="text-xs text-blue-100 leading-relaxed">
            Khi nhắn tin cho chủ tiệm, gửi kèm link demo mang chính tên tiệm của họ sẽ tăng tỷ lệ phản hồi lên 500% so với việc chào mời bán phần mềm chung chung.
          </p>
        </div>

        <div className="space-y-4">
          {scripts.map((script) => (
            <div key={script.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {script.title}
                </h3>
                <button
                  onClick={() => handleCopy(script.id, script.template)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  {copiedId === script.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép mẫu</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 text-xs sm:text-sm text-slate-700 whitespace-pre-line border border-slate-100 leading-relaxed font-sans">
                {script.template}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
