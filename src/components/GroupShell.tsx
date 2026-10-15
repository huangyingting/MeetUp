import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Users,
  User,
  Star,
  Share2,
  ChevronDown,
  Heart,
  Flag,
  Bell,
  LogOut,
  Check,
  X,
  DollarSign,
} from 'lucide-react';
import ShareModal from './ShareModal';
import ReportModal from './ReportModal';
import { gqlRequest } from '@/lib/gqlClient';

interface GroupShellProps {
  user: any;
  group: any;
  activeTab: 'about' | 'events' | 'members' | 'photos' | 'discussions' | 'reviews';
  initialIsMember: boolean;
  children: React.ReactNode;
}

export default function GroupShell({
  user,
  group,
  activeTab,
  initialIsMember,
  children,
}: GroupShellProps) {
  const [isMember, setIsMember] = useState(initialIsMember);
  const [manageMenuOpen, setManageMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState<number>(15);
  const [pledgeRaised, setPledgeRaised] = useState<number>(
    group.pledgeRaised ?? group.fundraisingRaised ?? 420
  );
  const [donatedSuccess, setDonatedSuccess] = useState(false);
  const groupPrivacy = group.privacy || (group.isPrivate ? 'Private' : 'Public');
  const pledgeGoalVal = group.pledgeGoal ?? group.fundraisingGoal ?? 500;

  const handleJoinToggle = async () => {
    if (isMember) {
      await gqlRequest('leaveGroup', { input: { groupId: group.id } });
      setIsMember(false);
      setManageMenuOpen(false);
    } else {
      await gqlRequest('joinGroup', { input: { groupId: group.id } });
      setIsMember(true);
    }
  };

  const handleDonate = async () => {
    const res = await gqlRequest('donateToGroup', {
      input: { groupId: group.id, amount: donateAmount },
    });
    if (res?.data?.donateToGroup?.group) {
      setPledgeRaised(res.data.donateToGroup.group.pledgeRaised);
    } else {
      setPledgeRaised(pledgeRaised + donateAmount);
    }
    setDonatedSuccess(true);
    setTimeout(() => {
      setDonatedSuccess(false);
      setDonateOpen(false);
    }, 1200);
  };

  const pledgePct = pledgeGoalVal
    ? Math.min(100, Math.round((pledgeRaised / pledgeGoalVal) * 100))
    : 0;

  return (
    <div>
      {/* Top Group Hero Card */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6">
              <div className="rounded-ds2-28 overflow-hidden border border-gray-200 shadow-xs h-72 sm:h-80">
                <img
                  src={group.coverImage}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              {group.isProNetwork && (
                <span className="inline-block px-3 py-1 rounded-ds2-max bg-indigo-100 text-indigo-900 ds2-b12">
                  Meetup Pro Network · {group.proNetworkName || group.name}
                </span>
              )}
              <h1 className="ds2-b32 text-gray-900">{group.name}</h1>

              <div className="space-y-2 ds2-m14 text-gray-700">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <Link
                    href={`/find?location=${encodeURIComponent(`${group.city}, ${group.state}`)}`}
                    className="hover:underline"
                  >
                    {group.city}, {group.state}
                  </Link>
                </p>
                <p className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>
                    {group.membersCount.toLocaleString()} members · {groupPrivacy} group
                  </span>
                  <Link
                    href={`/${group.urlname}/feedback-overview`}
                    className="inline-flex items-center gap-1 text-amber-600 hover:underline ml-2"
                  >
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {group.rating} ({group.ratingsCount.toLocaleString()} ratings)
                  </Link>
                </p>
                <p className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>
                    Organized by{' '}
                    <Link
                      href={`/members/${group.organizer?.memberId || '100200301'}`}
                      className="font-bold text-gray-900 hover:underline"
                    >
                      {group.organizer?.name || 'Eddy'}
                    </Link>{' '}
                    and 3 others
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {!isMember ? (
                  <button
                    type="button"
                    onClick={handleJoinToggle}
                    className="px-7 py-3 rounded-ds2-max bg-[#E51937] hover:bg-[#c8142f] text-white ds2-b16 transition"
                  >
                    Join this group
                  </button>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setManageMenuOpen(!manageMenuOpen)}
                      className="px-5 py-2.5 rounded-ds2-max bg-gray-900 text-white ds2-b16 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>You&apos;re a member</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {manageMenuOpen && (
                      <div className="absolute left-0 mt-2 w-60 bg-white rounded-ds2-20 shadow-ds2-lg-default border border-gray-200 py-2 z-40">
                        <Link
                          href={`/members/${user?.memberId || '484670701'}/group/${group.groupId}`}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 ds2-m14 text-gray-800"
                        >
                          <User className="w-4 h-4 text-gray-500" />
                          Membership details
                        </Link>
                        <Link
                          href={`/account/comm/${group.urlname}`}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 ds2-m14 text-gray-800"
                        >
                          <Bell className="w-4 h-4 text-gray-500" />
                          Notification settings
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setManageMenuOpen(false);
                            setReportOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 ds2-m14 text-gray-800 text-left"
                        >
                          <Flag className="w-4 h-4 text-gray-500" />
                          Report this group
                        </button>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          type="button"
                          onClick={handleJoinToggle}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-rose-50 ds2-m14 text-rose-600 text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Leave this group
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  className="px-4 py-2.5 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-m14 flex items-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>

                {pledgeGoalVal > 0 && (
                  <button
                    type="button"
                    onClick={() => setDonateOpen(true)}
                    className="px-4 py-2.5 rounded-ds2-max bg-teal-50 text-[#00798A] border border-teal-200 hover:bg-teal-100 ds2-b12 flex items-center gap-1.5"
                  >
                    <Heart className="w-4 h-4 fill-[#00798A]" />
                    Donate (${pledgeRaised}/${pledgeGoalVal})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Sub-Navigation Tab Bar */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-[1200px] mx-auto px-4 lg:px-6 flex items-center justify-between overflow-x-auto no-scrollbar">
            <nav aria-label="Group sections" className="flex items-center gap-6">
              {[
                { id: 'about', label: 'About', href: `/${group.urlname}` },
                { id: 'events', label: 'Events', href: `/${group.urlname}/events` },
                { id: 'members', label: 'Members', href: `/${group.urlname}/members` },
                { id: 'photos', label: 'Photos', href: `/${group.urlname}/photos` },
                { id: 'discussions', label: 'Discussions', href: `/${group.urlname}/discussions` },
                { id: 'reviews', label: 'Reviews', href: `/${group.urlname}/feedback-overview` },
              ].map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`py-4 ds2-b16 border-b-2 shrink-0 transition ${
                    activeTab === tab.id
                      ? 'border-[#00798A] text-[#00798A]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-8">{children}</div>

      {/* Fundraising / Donate Modal */}
      {donateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-ds2-28 max-w-md w-full p-6 shadow-ds2-lg-default relative space-y-5">
            <button
              type="button"
              onClick={() => setDonateOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="ds2-k13 text-[#00798A] uppercase">Fundraising via Pledge</span>
              <h2 className="ds2-b24 text-gray-900 mt-1">Support {group.name}</h2>
              <p className="ds2-r14 text-gray-600 mt-1">
                Help cover venue rentals, name tags, and Meetup organizer subscription costs.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between ds2-m13">
                <span className="font-bold text-gray-900">${pledgeRaised} raised</span>
                <span className="text-gray-500">Goal: ${group.pledgeGoal || 1000}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#00798A]" style={{ width: `${pledgePct}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {[5, 15, 25, 50].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDonateAmount(amt)}
                  className={`py-3 rounded-ds2-16 border-2 ds2-b16 ${
                    donateAmount === amt
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-800'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {donatedSuccess ? (
              <div className="p-3 rounded-ds2-16 bg-emerald-50 text-emerald-800 ds2-b16 text-center">
                Thank you for your ${donateAmount} contribution!
              </div>
            ) : (
              <button
                type="button"
                onClick={handleDonate}
                className="w-full py-3.5 rounded-ds2-max bg-[#00798A] hover:bg-[#006472] text-white ds2-b16 flex items-center justify-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                Donate ${donateAmount} now
              </button>
            )}
          </div>
        </div>
      )}

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title={group.name}
        subtitle={`${group.city}, ${group.state} · ${group.membersCount.toLocaleString()} members`}
        url={`/${group.urlname}`}
      />

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="GROUP"
        targetId={group.groupId}
        targetName={group.name}
      />
    </div>
  );
}
