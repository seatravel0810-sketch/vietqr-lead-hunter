'use client';

import React, { useState, useEffect } from 'react';
import { Lead } from '@/lib/types';
import { renderOutreachMessage, getZaloLink, generateStoreDemoUrl } from '@/lib/scripts-engine';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  MessageCircle, 
  Sparkles,
  Smartphone
} from 'lucide-react';

interface OutreachModalProps {
  lead: Lead | null;
  onClose: () => void;
  onSentSuccess: (leadId: string) => void;
}

export const OutreachModal: React.FC<OutreachModalProps> = ({
  lead,
  onClose,
  onSentSuccess,
}) => {
  const [message, setMessage] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (lead) {
      setMessage(renderOutreachMessage(lead));
      setCopiedText(false);
      setCopiedLink(false);
    }
  }, [lead]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!lead) return null;

  const demoUrl = lead.demoUrl || generateStoreDemoUrl(lead);
  const zaloLink = getZaloLink(lead.phone);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      alert('Không thể tự động copy, bạn hãy chọn đoạn văn và bấm Copy thủ công nhé.');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(demoUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      alert('Không thể copy link.');
    }
  };

  const handleOpenZaloAndSend = async () => {
    // 1. Copy message to clipboard first
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // ignore
    }

    // 2. Open Zalo chat
    window.open(zaloLink, '_blank');

    // 3. Mark status as contacted
    onSentSuccess(lead.id);

    // 4. Close modal
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <MessageCircle className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Gửi Tin Zalo Chào Hàng
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Gửi tới: <span className="font-semibold text-slate-800">{lead.name}</span> ({lead.phone})
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm">
          {/* Demo Link Highlight */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-center justify-between gap-2">
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Web Demo cá nhân hóa (App 1):</span>
              </div>
              <p className="text-xs text-blue-900 font-mono truncate">{demoUrl}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleCopyLink}
                className="p-2 bg-white text-blue-600 rounded-xl hover:bg-blue-100 border border-blue-200 transition"
                title="Sao chép link demo"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white text-blue-600 rounded-xl hover:bg-blue-100 border border-blue-200 transition"
                title="Mở xem thử trên tab mới"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Editable Message Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Nội dung tin nhắn Zalo (Tự động soạn theo ngành):
              </label>
              <button
                onClick={handleCopyMessage}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép text</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed text-slate-800 bg-slate-50/50"
              placeholder="Nhập nội dung tin nhắn gửi khách..."
            />
            <p className="text-[11px] text-slate-400 mt-1 italic">
              💡 Mẹo: Khi bấm gửi, hệ thống tự động chép tin nhắn này vào bộ nhớ tạm. Khi Zalo mở lên bạn chỉ cần dán (Ctrl+V hoặc Chạm giữ &gt; Dán) và bấm Gửi!
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleOpenZaloAndSend}
            className="w-full flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            <span>Mở Zalo &amp; Bắn Tin Ngay</span>
          </button>
          <button
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
