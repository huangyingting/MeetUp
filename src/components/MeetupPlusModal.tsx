import React, { useState } from 'react';
import { X, Check, Sparkles, Users, Zap, MessageSquare, Award } from 'lucide-react';
import { gqlRequest } from '@/lib/gqlClient';

interface MeetupPlusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribed?: () => void;
}

export default function MeetupPlusModal({ isOpen, onClose, onSubscribed }: MeetupPlusModalProps) {
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'YEARLY' | 'MONTHLY'>('YEARLY');
  const [submitting, setSubmitting] = useState(false);
  const [activated, setActivated] = useState(false);

  if (!isOpen) return null;

  const handleStartTrial = async () => {
    setSubmitting(true);
    await gqlRequest('subscribeMeetupPlus', { input: { plan: billingCycle } });
    setSubmitting(false);
    setActivated(true);
    setTimeout(() => {
      onSubscribed?.();
      onClose();
    }, 1000);
  };

  return (
    <div
      role="dialog"
      data-state="open"
      aria-label="Meetup+ Subscription"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-ds2-28 shadow-ds2-lg-default max-w-lg w-full overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Header */}
        <div className="bg-gradient-to-r from-[#141416] via-[#3B0764] to-[#D91B5C] text-white p-6 relative">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-ds2-max bg-white/15 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Meetup+ Member Upgrade
          </div>
          <h2 className="ds2-b24">Supercharge your social & professional life</h2>
          <p className="ds2-r14 text-white/85 mt-1">
            Stand out in every group, see full attendee lists, and unlock unlimited connections.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Features List */}
          <div className="space-y-3">
            {[
              {
                icon: Users,
                title: 'See full attendee lists and profiles',
                desc: 'Know exactly who is joining events before you RSVP.',
              },
              {
                icon: Zap,
                title: 'Priority event access & waitlist boost',
                desc: 'Get notified first and move to the top of full event waitlists.',
              },
              {
                icon: MessageSquare,
                title: 'Unlimited direct messaging',
                desc: 'Connect and chat with any Meetup member across any group.',
              },
              {
                icon: Award,
                title: 'Exclusive Meetup+ golden badge',
                desc: 'Stand out to hosts and fellow attendees with a verified Meetup+ badge.',
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="p-2 rounded-ds2-12 bg-pink-50 text-[#D91B5C] shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="ds2-b16 text-gray-900">{item.title}</p>
                  <p className="ds2-r12 text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Free Trial Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-ds2-16 bg-gray-50 border border-gray-200">
            <div>
              <p className="ds2-m14 text-gray-900">7-day free trial enabled</p>
              <p className="ds2-r12 text-gray-500">Cancel anytime in Account Settings · $0.00 due today</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={freeTrialEnabled}
              onClick={() => setFreeTrialEnabled(!freeTrialEnabled)}
              className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center ${
                freeTrialEnabled ? 'bg-[#00798A] justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {/* Plan Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBillingCycle('YEARLY')}
              className={`p-3.5 rounded-ds2-16 border-2 text-left transition relative ${
                billingCycle === 'YEARLY' ? 'border-gray-900 bg-gray-50/70' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <span className="absolute -top-2.5 right-3 bg-[#E51937] text-white ds2-m10 px-2 py-0.5 rounded-full">
                SAVE 25%
              </span>
              <p className="ds2-b16 text-gray-900">Yearly</p>
              <p className="ds2-m14 text-gray-700 mt-1">$10.83 / mo</p>
              <p className="ds2-r12 text-gray-500">$129.99 billed annually</p>
            </button>

            <button
              type="button"
              onClick={() => setBillingCycle('MONTHLY')}
              className={`p-3.5 rounded-ds2-16 border-2 text-left transition ${
                billingCycle === 'MONTHLY' ? 'border-gray-900 bg-gray-50/70' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <p className="ds2-b16 text-gray-900">Monthly</p>
              <p className="ds2-m14 text-gray-700 mt-1">$14.99 / mo</p>
              <p className="ds2-r12 text-gray-500">Flexible monthly billing</p>
            </button>
          </div>

          {/* Primary & Secondary CTAs */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              disabled={submitting}
              onClick={handleStartTrial}
              className="w-full py-3 px-6 rounded-ds2-max bg-gray-900 hover:bg-black text-white ds2-b16 transition flex items-center justify-center gap-2"
            >
              {activated ? (
                <>
                  <Check className="w-5 h-5 text-emerald-400" />
                  Meetup+ Activated!
                </>
              ) : freeTrialEnabled ? (
                'Start 7-day free trial'
              ) : (
                'Upgrade to Meetup+ now'
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-6 rounded-ds2-max text-gray-600 hover:text-gray-900 ds2-m14 transition"
            >
              Continue with free plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
