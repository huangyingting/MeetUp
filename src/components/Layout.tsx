import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Search,
  MapPin,
  Users,
  MessageSquare,
  Bell,
  Calendar,
  Compass,
  Sparkles,
  Home,
  ChevronDown,
  Bookmark,
  Settings,
  HelpCircle,
  LogOut,
  User as UserIcon,
  Code2,
  X,
  ShieldCheck,
} from 'lucide-react';
import MeetupPlusModal from './MeetupPlusModal';
import { gqlRequest } from '@/lib/gqlClient';

const KEYWORD_SUGGESTIONS = [
  'python',
  'python programming',
  'data science using python',
  'artificial intelligence',
  'llm & agentic ai',
  'singles mingle',
  'hiking & outdoors',
  'board games & trivia',
  'career coaching',
  'startup networking',
  'new in town',
];

const LOCATION_SUGGESTIONS = [
  { display: 'San Francisco, CA', slug: 'us--ca--san-francisco' },
  { display: 'Oakland, CA', slug: 'us--ca--oakland' },
  { display: 'San Jose, CA', slug: 'us--ca--san-jose' },
  { display: 'Livermore, CA', slug: 'us--ca--livermore' },
  { display: 'New York, NY', slug: 'us--ny--new-york' },
  { display: 'Seattle, WA', slug: 'us--wa--seattle' },
  { display: 'Austin, TX', slug: 'us--tx--austin' },
  { display: 'London, United Kingdom', slug: 'gb--london' },
];

interface LayoutProps {
  children: React.ReactNode;
  user?: any;
  hideChrome?: boolean;
}

export default function Layout({ children, user: initialUser, hideChrome = false }: LayoutProps) {
  const router = useRouter();
  const [selfData, setSelfData] = useState<any>(initialUser || null);
  const [logoHovered, setLogoHovered] = useState(false);

  // Search state
  const [keyword, setKeyword] = useState((router.query.q as string) || '');
  const [locationText, setLocationText] = useState((router.query.loc as string) || 'San Francisco, CA');
  const [keywordFocused, setKeywordFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);

  // Menus & Modals
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [meetupPlusOpen, setMeetupPlusOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  const searchContainerRef = useRef<HTMLFormElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gqlRequest('getSelf').then((res) => {
      if (res?.self) setSelfData(res.self);
    }).catch(() => {});
  }, [router.asPath]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setKeywordFocused(false);
        setLocationFocused(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (hideChrome) {
    return <div className="min-h-screen bg-[#FCFCFD] text-[#141416]">{children}</div>;
  }

  const activeName = selfData?.name || 'wlfjck';
  const activeMemberId = selfData?.id || selfData?.memberId || '484670701';
  const hasGroupDraft = Boolean(selfData?.hasGroupDraft);
  const unreadNotifications = selfData?.unreadNotifications ?? 2;
  const unreadMessages = selfData?.unreadMessages ?? 2;

  const filteredKeywords = keyword.trim()
    ? KEYWORD_SUGGESTIONS.filter((k) => k.toLowerCase().includes(keyword.toLowerCase()))
    : KEYWORD_SUGGESTIONS.slice(0, 6);

  const filteredLocations = locationText.trim()
    ? LOCATION_SUGGESTIONS.filter((l) => l.display.toLowerCase().includes(locationText.toLowerCase()))
    : LOCATION_SUGGESTIONS;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKeywordFocused(false);
    setLocationFocused(false);
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keywords', keyword.trim());
    if (locationText.trim()) params.set('location', locationText.trim());
    router.push(`/find?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCFD] text-[#141416]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-gray-900 text-white px-4 py-2 rounded-ds2-max z-50"
      >
        Skip to content
      </a>

      {/* Global Sticky DS2 Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-[1380px] mx-auto px-4 lg:px-6 h-[72px] flex items-center justify-between gap-3">
          {/* Left: Meetup Logo with Hover Morph into Homepage Pill + Dual Search Bar */}
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <button
              type="button"
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
              onClick={() => router.push('/home')}
              className="relative flex items-center justify-center h-10 px-3 rounded-ds2-max transition-all duration-200 hover:bg-gray-100 shrink-0"
              aria-label="Homepage"
            >
              {logoHovered ? (
                <span className="flex items-center gap-1.5 ds2-b16 text-[#E51937]">
                  <Home className="w-4 h-4" />
                  Homepage
                </span>
              ) : (
                <span className="font-black text-2xl tracking-tighter text-[#E51937] lowercase select-none">
                  meetup<span className="text-[#F65858]">.</span>
                </span>
              )}
            </button>

            {/* Dual Search Input Bar */}
            <form
              ref={searchContainerRef}
              onSubmit={handleSearchSubmit}
              className="relative flex items-center flex-1 h-11 rounded-ds2-max bg-[#F4F4F6] border border-gray-200 focus-within:bg-white focus-within:border-gray-900 focus-within:shadow-ds2-sm transition"
            >
              {/* Keyword Half */}
              <div className="relative flex items-center flex-1 pl-4 pr-2 h-full">
                <Search className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
                <input
                  type="text"
                  name="keywords"
                  data-testid="search-events-input"
                  value={keyword}
                  onFocus={() => {
                    setKeywordFocused(true);
                    setLocationFocused(false);
                  }}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search events"
                  aria-label="Search events"
                  className="w-full bg-transparent ds2-r14 text-gray-900 placeholder:text-gray-500 focus:outline-none"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => setKeyword('')}
                    className="p-1 text-gray-400 hover:text-gray-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="h-6 w-[1px] bg-gray-300" />

              {/* Location Half */}
              <div className="relative flex items-center flex-1 pl-3 pr-1.5 h-full">
                <MapPin className="w-4 h-4 text-gray-500 mr-1.5 shrink-0" />
                <input
                  type="text"
                  role="combobox"
                  aria-expanded={locationFocused}
                  name="location-typeahead-header-search"
                  data-testid="Location search"
                  value={locationText}
                  onFocus={() => {
                    setLocationFocused(true);
                    setKeywordFocused(false);
                  }}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="Neighborhood, city or zip"
                  aria-label="Location search"
                  className="w-full bg-transparent ds2-r14 text-gray-900 placeholder:text-gray-500 focus:outline-none"
                />
                <button
                  type="submit"
                  data-testid="location-search-submit"
                  aria-label="Search"
                  className="w-8 h-8 rounded-full bg-[#E51937] hover:bg-[#c8142f] text-white flex items-center justify-center shrink-0 transition"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Keyword Typeahead Popover */}
              {keywordFocused && (
                <div
                  data-radix-popper-content-wrapper=""
                  className="absolute top-13 left-0 w-80 bg-white rounded-ds2-20 shadow-ds2-lg-default border border-gray-200 p-3 z-50"
                >
                  <p className="ds2-k13 text-gray-400 uppercase px-2 mb-1.5">
                    {keyword.trim() ? 'Suggested Searches' : 'Popular Searches'}
                  </p>
                  <div className="space-y-0.5">
                    {filteredKeywords.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setKeyword(item);
                          setKeywordFocused(false);
                          router.push(`/find?keywords=${encodeURIComponent(item)}`);
                        }}
                        className="w-full text-left px-3 py-2 rounded-ds2-12 hover:bg-gray-100 flex items-center gap-2.5 ds2-m14 text-gray-800 transition"
                      >
                        <Search className="w-3.5 h-3.5 text-gray-400" />
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Typeahead Popover */}
              {locationFocused && (
                <div
                  data-radix-popper-content-wrapper=""
                  className="absolute top-13 right-0 w-80 bg-white rounded-ds2-20 shadow-ds2-lg-default border border-gray-200 p-3 z-50"
                >
                  <p className="ds2-k13 text-gray-400 uppercase px-2 mb-1.5">Popular Cities</p>
                  <div className="space-y-0.5">
                    {filteredLocations.map((loc) => (
                      <button
                        key={loc.slug}
                        type="button"
                        onClick={() => {
                          setLocationText(loc.display);
                          setLocationFocused(false);
                          router.push(`/find/${loc.slug}`);
                        }}
                        className="w-full text-left px-3 py-2 rounded-ds2-12 hover:bg-gray-100 flex items-center gap-2.5 ds2-m14 text-gray-800 transition"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#00798A]" />
                        {loc.display}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right: Stateful Group CTA, Try Meetup+/Pro, Quick Icons & Profile Dropdown */}
          <div className="flex items-center gap-2 lg:gap-3">
            <button
              type="button"
              onClick={() => router.push('/start')}
              className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-ds2-max hover:bg-gray-100 ds2-m14 text-gray-900 transition"
            >
              <span>{hasGroupDraft ? 'Finish your group' : 'Start a new group'}</span>
              <span className="px-2 py-0.5 rounded-ds2-max bg-emerald-100 text-emerald-800 ds2-b12">
                30% off
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMeetupPlusOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-ds2-max bg-gradient-to-r from-gray-900 to-[#3B0764] text-white ds2-m13 hover:opacity-95 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{selfData?.isMeetupPlus ? 'Meetup+ Active' : 'Try Meetup+'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">Free</span>
            </button>

            {/* Quick Nav Icons */}
            <nav className="flex items-center gap-1">
              <Link
                href="/friends"
                title="Connections"
                className={`p-2 rounded-full hover:bg-gray-100 transition ${
                  router.pathname === '/friends' ? 'text-[#00798A] bg-teal-50' : 'text-gray-700'
                }`}
              >
                <Users className="w-5 h-5" />
              </Link>
              <Link
                href="/messages"
                title="Messages"
                className={`relative p-2 rounded-full hover:bg-gray-100 transition ${
                  router.pathname === '/messages' ? 'text-[#00798A] bg-teal-50' : 'text-gray-700'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E51937]" />
                )}
              </Link>
              <Link
                href="/notifications"
                title="Notifications"
                className={`relative p-2 rounded-full hover:bg-gray-100 transition ${
                  router.pathname === '/notifications' ? 'text-[#00798A] bg-teal-50' : 'text-gray-700'
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E51937]" />
                )}
              </Link>
              <Link
                href="/your-events"
                title="Your events"
                className={`hidden lg:flex p-2 rounded-full hover:bg-gray-100 transition ${
                  router.pathname === '/your-events' ? 'text-[#00798A] bg-teal-50' : 'text-gray-700'
                }`}
              >
                <Calendar className="w-5 h-5" />
              </Link>
              <Link
                href="/groups"
                title="Your groups"
                className={`hidden lg:flex p-2 rounded-full hover:bg-gray-100 transition ${
                  router.pathname === '/groups' ? 'text-[#00798A] bg-teal-50' : 'text-gray-700'
                }`}
              >
                <Compass className="w-5 h-5" />
              </Link>
            </nav>

            {/* Profile Avatar Menu Button */}
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                aria-label="Profile menu"
                className="flex items-center gap-1 pl-1 pr-1.5 py-1 rounded-ds2-max border border-gray-200 hover:border-gray-400 transition"
              >
                <span className="w-8 h-8 rounded-full bg-pink-100 text-[#D91B5C] font-bold flex items-center justify-center text-sm uppercase">
                  {activeName.slice(0, 1)}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  data-radix-popper-content-wrapper=""
                  className="absolute right-0 mt-2 w-64 bg-white rounded-ds2-20 shadow-ds2-lg-default border border-gray-200 py-2 z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="ds2-b16 text-gray-900">{activeName}</p>
                    <Link
                      href={`/members/${activeMemberId}`}
                      onClick={() => setProfileMenuOpen(false)}
                      className="ds2-m13 text-[#00798A] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      View profile
                    </Link>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/your-events"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 ds2-m14 text-gray-800 hover:bg-gray-50"
                    >
                      <Calendar className="w-4 h-4 text-gray-500" />
                      Your events
                    </Link>
                    <Link
                      href="/groups"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 ds2-m14 text-gray-800 hover:bg-gray-50"
                    >
                      <Users className="w-4 h-4 text-gray-500" />
                      Your groups
                    </Link>
                    <Link
                      href="/your-events?type=saved"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 ds2-m14 text-gray-800 hover:bg-gray-50"
                    >
                      <Bookmark className="w-4 h-4 text-gray-500" />
                      Saved events
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 py-1">
                    <Link
                      href="/account"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 ds2-m14 text-gray-800 hover:bg-gray-50"
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      Account settings
                    </Link>
                    <Link
                      href="/graphql/playground"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 ds2-m14 text-gray-800 hover:bg-gray-50"
                    >
                      <Code2 className="w-4 h-4 text-gray-500" />
                      API & GraphQL Playground
                    </Link>
                    <Link
                      href="/welcome/intent?preview=1"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 ds2-m14 text-gray-800 hover:bg-gray-50"
                    >
                      <Sparkles className="w-4 h-4 text-gray-500" />
                      Onboarding Wizard
                    </Link>
                    <Link
                      href="/about"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 ds2-m14 text-gray-800 hover:bg-gray-50"
                    >
                      <HelpCircle className="w-4 h-4 text-gray-500" />
                      Help & About
                    </Link>
                    <Link
                      href="/login"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 ds2-m14 text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main" className="flex-1">
        {children}
      </main>

      {/* Global DS2 Dark Footer */}
      <footer className="bg-[#141416] text-white mt-16">
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          {/* Top Organizer Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-white/15 gap-4">
            <div className="flex items-center gap-3">
              <span className="font-black text-2xl text-[#E51937] lowercase">meetup.</span>
              <span className="ds2-b16 text-white/90">
                The people platform. Create your own Meetup group.
              </span>
            </div>
            <Link
              href="/start"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-ds2-max border-2 border-white hover:bg-white hover:text-gray-900 ds2-b16 transition"
            >
              {hasGroupDraft ? 'Finish Group' : 'Get Started'}
            </Link>
          </div>

          {/* 3-Column Footer Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10">
            <div>
              <h3 className="ds2-b16 text-white mb-3">Your account</h3>
              <ul className="space-y-2 ds2-r14 text-gray-400">
                <li><Link href="/account" className="hover:text-white">Settings</Link></li>
                <li><Link href="/login" className="hover:text-white">Log out</Link></li>
                <li><Link href="/your-events" className="hover:text-white">Your events</Link></li>
                <li><Link href="/groups" className="hover:text-white">Your groups</Link></li>
                <li><Link href="/welcome/intent?preview=1" className="hover:text-white">Onboarding Wizard</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="ds2-b16 text-white mb-3">Discover</h3>
              <ul className="space-y-2 ds2-r14 text-gray-400">
                <li><Link href="/find?source=GROUPS" className="hover:text-white">Groups</Link></li>
                <li><Link href="/find?source=EVENTS" className="hover:text-white">Events</Link></li>
                <li><Link href="/topics" className="hover:text-white">Topics</Link></li>
                <li><Link href="/cities" className="hover:text-white">Cities</Link></li>
                <li><Link href="/find/online-events" className="hover:text-white">Online events</Link></li>
                <li><Link href="/lp/friendship-and-socializing" className="hover:text-white">Make friends</Link></li>
                <li><Link href="/sitemap" className="hover:text-white">Sitemap</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="ds2-b16 text-white mb-3">Meetup</h3>
              <ul className="space-y-2 ds2-r14 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/meetup-pro" className="hover:text-white">Meetup Pro</Link></li>
                <li><Link href="/how-to-group-start" className="hover:text-white">How to start a group</Link></li>
                <li><Link href="/apps" className="hover:text-white">Apps</Link></li>
                <li><Link href="/graphql" className="hover:text-white">GraphQL API Docs</Link></li>
                <li><Link href="/graphql/playground" className="hover:text-white">GraphQL Playground</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="ds2-b16 text-white mb-3">Get the app</h3>
              <div className="space-y-2.5">
                <Link
                  href="/apps"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-ds2-12 bg-white/10 hover:bg-white/15 border border-white/15 transition"
                >
                  <div className="text-left">
                    <p className="text-[10px] uppercase text-gray-400">Download on the</p>
                    <p className="ds2-b16 text-white">App Store</p>
                  </div>
                </Link>
                <Link
                  href="/apps"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-ds2-12 bg-white/10 hover:bg-white/15 border border-white/15 transition"
                >
                  <div className="text-left">
                    <p className="text-[10px] uppercase text-gray-400">Download on</p>
                    <p className="ds2-b16 text-white">Google Play</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Legal & OneTrust Privacy Bar */}
          <div className="pt-8 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 ds2-r12 text-gray-400">
            <p>© 2026 Bending Spoons Operations S.p.A. · Meetup Clone Full Parity Edition</p>
            <div className="flex flex-wrap items-center gap-5">
              <Link href="/about" className="hover:text-white">Terms of service</Link>
              <Link href="/account/privacy" className="hover:text-white">Privacy policy</Link>
              <button
                type="button"
                data-testid="privacy-settings"
                onClick={() => setPrivacyModalOpen(true)}
                className="hover:text-white underline"
              >
                Your privacy choices
              </button>
              <Link href="/sitemap" className="hover:text-white">Sitemap</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Meetup+ Upsell Modal */}
      <MeetupPlusModal
        isOpen={meetupPlusOpen}
        onClose={() => setMeetupPlusOpen(false)}
        onSubscribed={() => {
          gqlRequest('getSelf').then((res) => {
            if (res?.self) setSelfData(res.self);
          });
        }}
      />

      {/* OneTrust Privacy Consent Modal */}
      {privacyModalOpen && (
        <div
          role="dialog"
          aria-label="Your privacy choices"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPrivacyModalOpen(false)}
        >
          <div
            className="bg-white rounded-ds2-24 max-w-lg w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00798A]" />
                <h2 className="ds2-b20 text-gray-900">Your privacy choices (TCF v2.2)</h2>
              </div>
              <button onClick={() => setPrivacyModalOpen(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="ds2-r14 text-gray-600">
              Manage your cookie and tracking preferences for Strictly Necessary, Performance, Functional, and Targeting cookies.
            </p>
            <div className="space-y-2 ds2-m14">
              {['Strictly Necessary Cookies (Always Active)', 'Performance Cookies', 'Functional Cookies', 'Targeting Cookies'].map((c, i) => (
                <label key={c} className="flex items-center justify-between p-3 rounded-ds2-12 bg-gray-50">
                  <span>{c}</span>
                  <input type="checkbox" defaultChecked disabled={i === 0} className="accent-[#00798A] w-4 h-4" />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPrivacyModalOpen(false)}
                className="px-4 py-2 rounded-ds2-max border border-gray-300 ds2-m14"
              >
                Reject Optional
              </button>
              <button
                onClick={() => setPrivacyModalOpen(false)}
                className="px-5 py-2 rounded-ds2-max bg-gray-900 text-white ds2-b16"
              >
                Confirm My Choices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
