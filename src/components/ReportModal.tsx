import React, { useState } from 'react';
import { X, Flag, CheckCircle2 } from 'lucide-react';
import { gqlRequest } from '@/lib/gqlClient';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'EVENT' | 'GROUP' | 'MEMBER';
  targetId: string;
  targetName: string;
}

const REPORT_REASONS = [
  'Spam, scam, or deceptive link',
  'Hate speech, bullying, or harassment',
  'Violence, dangerous behavior, or illegal activity',
  'Nudity or sexually explicit content',
  'Intellectual property or copyright violation',
  'Something else',
];

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await gqlRequest('submitReport', {
      input: {
        targetType,
        targetId,
        reason: selectedReason,
        details,
      },
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div
      role="dialog"
      data-state="open"
      aria-label={`Report ${targetType.toLowerCase()}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-ds2-24 shadow-ds2-lg-default max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-[#E51937]" />
            <h2 className="ds2-b20 text-gray-900">Why are you reporting this {targetType.toLowerCase()}?</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-10 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <p className="ds2-b16 text-gray-900">Thank you for your report</p>
            <p className="ds2-r14 text-gray-500">
              Our Trust & Safety team will review &ldquo;{targetName}&rdquo; promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2" role="radiogroup">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-ds2-12 border cursor-pointer transition ${
                    selectedReason === reason
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="accent-gray-900"
                  />
                  <span className="ds2-m14 text-gray-800">{reason}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block ds2-m12 text-gray-600 mb-1">Additional details (optional)</label>
              <textarea
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Share any context that helps our Trust & Safety team..."
                className="w-full rounded-ds2-12 border border-gray-300 px-3 py-2 ds2-r14 focus:outline-none focus:border-gray-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-ds2-max ds2-m14 text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-ds2-max bg-[#E51937] hover:bg-[#c8142f] text-white ds2-b16 transition"
              >
                Submit report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
