import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  User,
  Sliders,
  Lock,
  Bell,
  Shield,
  Share2,
  Sparkles,
  Smartphone,
  CreditCard,
  Receipt,
  Code2,
  Crown,
} from 'lucide-react';

const ACCOUNT_NAV_ITEMS = [
  { href: '/account', label: 'Edit Profile', icon: User },
  { href: '/account/personal', label: 'Personal Info', icon: Sliders },
  { href: '/account/management', label: 'Account Management', icon: Lock },
  { href: '/account/comm', label: 'Email Updates', icon: Bell },
  { href: '/account/privacy', label: 'Privacy', icon: Shield },
  { href: '/account/services', label: 'Social Media', icon: Share2 },
  { href: '/account/interests', label: 'Interests', icon: Sparkles },
  { href: '/account/mobile', label: 'Mobile', icon: Smartphone },
  { href: '/account/subscription', label: 'Organizer Subscription', icon: Crown },
  { href: '/account/member-plus', label: 'Meetup+', icon: Sparkles },
  { href: '/account/payment-methods', label: 'Payment Methods', icon: CreditCard },
  { href: '/payments/payments_made', label: 'Payments Made', icon: Receipt },
  { href: '/payments/dues_payments_made', label: 'Payments Received', icon: Receipt },
  { href: '/account/oauth_apps', label: 'Apps', icon: Code2 },
];

export default function AccountShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      <aside className="lg:col-span-3">
        <div className="bg-white rounded-ds2-24 border border-gray-200 p-3 space-y-1 shadow-xs">
          <p className="px-3 py-2 ds2-k13 text-gray-400 uppercase">Settings</p>
          {ACCOUNT_NAV_ITEMS.map((item) => {
            const active =
              router.pathname === item.href ||
              (item.href !== '/account' && router.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-ds2-12 ds2-m14 transition ${
                  active
                    ? 'bg-gray-900 text-white font-bold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      <div className="lg:col-span-9 space-y-6">
        <div className="bg-white rounded-ds2-28 border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h1 className="ds2-b28 text-gray-900">{title}</h1>
            {subtitle && <p className="ds2-r14 text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
