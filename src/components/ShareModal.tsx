import React, { useState } from 'react';
import { X, Copy, Check, Download, Share2, Mail, MessageCircle, Globe, Sparkles } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  url: string;
  dateStr?: string;
  venueStr?: string;
  flyerOnly?: boolean;
}

export default function ShareModal({
  isOpen,
  onClose,
  title,
  subtitle = 'San Francisco, CA',
  url,
  dateStr = 'Sun, Oct 18 · 6:00 PM PDT',
  venueStr = 'San Francisco, CA',
  flyerOnly = false,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<'coral' | 'viridian' | 'midnight'>('coral');
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : `https://www.meetup.com${url}`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFlyer = (formatName: string) => {
    setDownloadedFormat(formatName);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = formatName === 'Story (9:16)' ? 1420 : formatName === 'Square (1:1)' ? 800 : 450;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = selectedTheme === 'coral' ? '#E51937' : selectedTheme === 'viridian' ? '#00798A' : '#141416';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('meetup', 48, 72);
        ctx.font = 'bold 42px sans-serif';
        ctx.fillText(title.slice(0, 34), 48, 160);
        ctx.font = '24px sans-serif';
        ctx.fillText(dateStr, 48, 220);
        ctx.fillText(venueStr, 48, 260);
        const link = document.createElement('a');
        link.download = `meetup-flyer-${formatName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch {
      // Fallback in headless browser
    }
    setTimeout(() => setDownloadedFormat(null), 2000);
  };

  const bgGradient =
    selectedTheme === 'coral'
      ? 'from-[#E51937] via-[#F65858] to-[#FF8A65]'
      : selectedTheme === 'viridian'
        ? 'from-[#00798A] via-[#0097A7] to-[#26C6DA]'
        : 'from-[#141416] via-[#27272A] to-[#7C3AED]';

  return (
    <div
      role="dialog"
      data-state="open"
      aria-label={flyerOnly ? 'Share a flyer' : 'Share this event'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-ds2-24 shadow-ds2-lg-default max-w-xl w-full p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 className="ds2-b20 text-gray-900">{flyerOnly ? 'Share a flyer' : 'Share this event'}</h2>
            <p className="ds2-r14 text-gray-500 mt-0.5 line-clamp-1">{title}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!flyerOnly && (
          <div className="mt-5">
            <p className="ds2-m13 text-gray-600 mb-3">Share via social or direct link</p>
            <div className="grid grid-cols-5 gap-2.5">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-1.5 p-3 rounded-ds2-12 border border-gray-200 hover:border-gray-900 transition text-center"
              >
                <Globe className="w-5 h-5 text-blue-600" />
                <span className="ds2-m12">Facebook</span>
              </a>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + fullUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-1.5 p-3 rounded-ds2-12 border border-gray-200 hover:border-gray-900 transition text-center"
              >
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span className="ds2-m12">WhatsApp</span>
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-1.5 p-3 rounded-ds2-12 border border-gray-200 hover:border-gray-900 transition text-center"
              >
                <Share2 className="w-5 h-5 text-sky-700" />
                <span className="ds2-m12">LinkedIn</span>
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(fullUrl)}`}
                className="flex flex-col items-center gap-1.5 p-3 rounded-ds2-12 border border-gray-200 hover:border-gray-900 transition text-center"
              >
                <Mail className="w-5 h-5 text-rose-600" />
                <span className="ds2-m12">Email</span>
              </a>
              <button
                onClick={handleCopy}
                className="flex flex-col items-center gap-1.5 p-3 rounded-ds2-12 border border-gray-200 hover:border-gray-900 transition text-center"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-gray-800" />}
                <span className="ds2-m12">{copied ? 'Copied!' : 'Copy link'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Flyer Studio Generator */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E51937]" />
              <span className="ds2-b16 text-gray-900">Downloadable Event Flyers</span>
            </div>
            <div className="flex items-center gap-1.5">
              {(['coral', 'viridian', 'midnight'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTheme(t)}
                  className={`px-2.5 py-1 rounded-ds2-max ds2-m11 capitalize border ${
                    selectedTheme === t ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['Story (9:16)', 'Square (1:1)', 'Landscape (16:9)'].map((format) => (
              <div
                key={format}
                className="rounded-ds2-12 border border-gray-200 p-2.5 flex flex-col justify-between bg-gray-50"
              >
                <div
                  className={`rounded-ds2-8 bg-gradient-to-br ${bgGradient} text-white p-3 flex flex-col justify-between min-h-[125px] shadow-xs`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold tracking-tight text-xs lowercase">meetup</span>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{format.split(' ')[0]}</span>
                  </div>
                  <div className="my-2">
                    <p className="font-bold text-xs line-clamp-2 leading-snug">{title}</p>
                    <p className="text-[10px] opacity-90 mt-1">{dateStr}</p>
                  </div>
                  <p className="text-[10px] opacity-80 truncate">{subtitle}</p>
                </div>

                <button
                  onClick={() => handleDownloadFlyer(format)}
                  className="mt-2.5 w-full py-1.5 px-3 rounded-ds2-max bg-white border border-gray-300 hover:border-gray-900 ds2-m12 flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadedFormat === format ? 'Downloaded!' : `Download ${format.split(' ')[0]}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
