import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import {
  ArrowLeft,
  Check,
  Plus,
  Search,
  Sparkles,
  Users,
  Calendar,
  DollarSign,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

const ALL_WELCOME_STEPS = [
  'intent',
  'organizer-intro-1',
  'organizer-intro-2',
  'organizer-intro-3',
  'goal',
  'people',
  'hangout',
  'interests',
  'age',
  'gender',
  'sms-number',
  'whatsapp-number',
  'intro-paywall',
  'groups',
] as const;

const GOAL_OPTIONS = [
  'Make new friends',
  'Find a community',
  'Practice a hobby',
  'Build a professional network',
  'Date or find a partner',
  'Learn something new',
  'Have fun',
  'Explore the city',
];

const PEOPLE_OPTIONS = [
  'People my age',
  'Locals',
  'Newcomers in town',
  'Expats',
  'Single people',
  'Couples',
  'Young professionals',
  'Parents',
  'LGBTQ+',
  'Women only',
  'Men only',
  'Anyone',
];

const HANGOUT_OPTIONS = [
  'Coffee or tea',
  'Drinks or dinner',
  'Outdoor walks & hikes',
  'Board games or trivia',
  'Workshops & classes',
  'Sports & fitness',
  'Arts & culture',
  'Live music',
  'Online events',
  'Coworking',
];

const COUNTRY_CODES = [
  { code: 'US +1', label: 'United States (+1)' },
  { code: 'CA +1', label: 'Canada (+1)' },
  { code: 'GB +44', label: 'United Kingdom (+44)' },
  { code: 'SG +65', label: 'Singapore (+65)' },
  { code: 'DE +49', label: 'Germany (+49)' },
  { code: 'AU +61', label: 'Australia (+61)' },
];

export default function WelcomeWizardPage({
  initialStep,
  topics,
  suggestedGroups,
  joinedGroupIds: initialJoinedIds,
}: {
  initialStep: string;
  topics: any[];
  suggestedGroups: any[];
  joinedGroupIds: string[];
}) {
  const router = useRouter();
  const stepSlug = Array.isArray(router.query.step)
    ? router.query.step[0]
    : initialStep || 'intent';

  const [intentChoice, setIntentChoice] = useState<'find' | 'create' | 'both' | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Make new friends', 'Practice a hobby']);
  const [customGoalOpen, setCustomGoalOpen] = useState(false);
  const [customGoalText, setCustomGoalText] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<string[]>(['People my age', 'Young professionals']);
  const [selectedHangouts, setSelectedHangouts] = useState<string[]>(['Coffee or tea', 'Workshops & classes']);
  const [topicQuery, setTopicQuery] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    'New Technology',
    'Outdoors',
    'Make New Friends',
    'Social Networking',
  ]);
  const [birthMonth, setBirthMonth] = useState('05');
  const [birthDay, setBirthDay] = useState('15');
  const [birthYear, setBirthYear] = useState('1993');
  const [ageError, setAgeError] = useState<string | null>(null);
  const [gender, setGender] = useState<string>('Man');
  const [countryCode, setCountryCode] = useState('US +1');
  const [phoneInput, setPhoneInput] = useState('415-555-0192');
  const [freeTrialSwitch, setFreeTrialSwitch] = useState(true);
  const [paywallPlan, setPaywallPlan] = useState<'YEARLY' | 'MONTHLY'>('YEARLY');
  const [joinedIds, setJoinedIds] = useState<string[]>(initialJoinedIds);

  const stepIndex = Math.max(0, ALL_WELCOME_STEPS.indexOf(stepSlug as any));
  const progressPct = Math.round(((stepIndex + 1) / ALL_WELCOME_STEPS.length) * 100);

  const goToStep = (nextStep: string) => {
    router.push(`/welcome/${nextStep}`);
  };

  const handleBack = () => {
    if (stepSlug === 'goal' && intentChoice === 'find') {
      goToStep('intent');
      return;
    }
    if (stepIndex > 0) {
      goToStep(ALL_WELCOME_STEPS[stepIndex - 1]);
    }
  };

  const toggleChip = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleValidateAndNextAge = async () => {
    const m = parseInt(birthMonth, 10);
    const d = parseInt(birthDay, 10);
    const y = parseInt(birthYear, 10);
    if (isNaN(m) || m < 1 || m > 12 || isNaN(d) || d < 1 || d > 31 || isNaN(y) || y < 1905 || y > 2008) {
      setAgeError('Please enter a valid birthday (you must be at least 18 years old).');
      return;
    }
    setAgeError(null);
    await gqlRequest('updateMemberData', {
      input: { birthDate: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` },
    });
    goToStep('gender');
  };

  const handleFinishOnboarding = async () => {
    await gqlRequest('recordMemberAction', {
      input: { action: 'onboarding_completed' },
    });
    router.push('/home');
  };

  const visibleTopics = topicQuery.trim()
    ? topics.filter((t) => t.name.toLowerCase().includes(topicQuery.toLowerCase()))
    : topics;

  return (
    <div className="min-h-screen bg-[#FCFCFD] flex flex-col">
      <Head>
        <title>Welcome to Meetup — Step: {stepSlug}</title>
      </Head>

      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ds2-max hover:bg-gray-100 ds2-m14 text-gray-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <span className="font-black text-2xl text-[#E51937] lowercase">meetup.</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="ds2-m12 text-gray-500">
              Step {stepIndex + 1} of {ALL_WELCOME_STEPS.length} ({stepSlug})
            </span>
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="px-3.5 py-1.5 rounded-ds2-max text-gray-500 hover:text-gray-900 ds2-m13"
            >
              Skip to Home
            </button>
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00798A] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <div className="bg-gray-50 border-b border-gray-200 py-2 px-4 overflow-x-auto no-scrollbar">
        <div className="max-w-5xl mx-auto flex items-center gap-1.5">
          {ALL_WELCOME_STEPS.map((s, idx) => (
            <button
              key={s}
              type="button"
              onClick={() => goToStep(s)}
              className={`px-2.5 py-1 rounded-ds2-max ds2-m11 shrink-0 transition ${
                stepSlug === s
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {idx + 1}. {s}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-ds2-28 shadow-ds2-sm border border-gray-200 p-8">
          {stepSlug === 'intent' && (
            <div className="space-y-6">
              <div>
                <p className="ds2-k13 text-[#00798A] uppercase">Welcome, wlfjck!</p>
                <h1 className="ds2-b24 text-gray-900 mt-1">How would you like to use Meetup?</h1>
                <p className="ds2-r14 text-gray-500 mt-1">
                  We’ll personalize your experience based on what you want to do first.
                </p>
              </div>

              <div role="radiogroup" className="space-y-3">
                {[
                  { id: 'find', label: 'To find groups and events', desc: 'Discover local and online events matching your passions' },
                  { id: 'create', label: 'To create a group and host events', desc: 'Start your own community and bring people together' },
                  { id: 'both', label: 'Both', desc: 'Attend local events and organize your own Meetup group' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={intentChoice === opt.id}
                    onClick={() => setIntentChoice(opt.id as any)}
                    className={`w-full p-4 rounded-ds2-20 border-2 text-left flex items-center justify-between transition ${
                      intentChoice === opt.id
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div>
                      <p className="ds2-b16 text-gray-900">{opt.label}</p>
                      <p className="ds2-r12 text-gray-500 mt-0.5">{opt.desc}</p>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        intentChoice === opt.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300'
                      }`}
                    >
                      {intentChoice === opt.id && <Check className="w-3 h-3" />}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={!intentChoice}
                onClick={() => {
                  if (intentChoice === 'find') goToStep('goal');
                  else goToStep('organizer-intro-1');
                }}
                className="w-full py-3.5 rounded-ds2-max bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white ds2-b16 transition"
              >
                Continue
              </button>
            </div>
          )}

          {(stepSlug === 'organizer-intro-1' ||
            stepSlug === 'organizer-intro-2' ||
            stepSlug === 'organizer-intro-3') && (
            <div className="space-y-6 text-center py-4">
              {stepSlug === 'organizer-intro-1' && (
                <>
                  <div className="w-16 h-16 rounded-ds2-20 bg-teal-50 text-[#00798A] flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8" />
                  </div>
                  <h1 className="ds2-b24 text-gray-900">Empower your community with Meetup</h1>
                  <p className="ds2-r16 text-gray-600">
                    We immediately promote your new group to over 64 million members looking for communities like yours.
                  </p>
                  <button
                    type="button"
                    onClick={() => goToStep('organizer-intro-2')}
                    className="w-full py-3.5 rounded-ds2-max bg-gray-900 text-white ds2-b16"
                  >
                    Next
                  </button>
                </>
              )}
              {stepSlug === 'organizer-intro-2' && (
                <>
                  <div className="w-16 h-16 rounded-ds2-20 bg-rose-50 text-[#E51937] flex items-center justify-center mx-auto">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h1 className="ds2-b24 text-gray-900">Event management made easy</h1>
                  <p className="ds2-r16 text-gray-600">
                    Schedule recurring events, track RSVPs and waitlists, and chat with attendees effortlessly.
                  </p>
                  <button
                    type="button"
                    onClick={() => goToStep('organizer-intro-3')}
                    className="w-full py-3.5 rounded-ds2-max bg-gray-900 text-white ds2-b16"
                  >
                    Next
                  </button>
                </>
              )}
              {stepSlug === 'organizer-intro-3' && (
                <>
                  <div className="w-16 h-16 rounded-ds2-20 bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <h1 className="ds2-b24 text-gray-900">Turn your passion into profit</h1>
                  <p className="ds2-r16 text-gray-600">
                    Offset costs or build a business with event ticket fees, member dues, and Pledge fundraising.
                  </p>
                  <button
                    type="button"
                    onClick={() => goToStep('goal')}
                    className="w-full py-3.5 rounded-ds2-max bg-gray-900 text-white ds2-b16"
                  >
                    Continue
                  </button>
                </>
              )}
            </div>
          )}

          {stepSlug === 'goal' && (
            <div className="space-y-6">
              <div>
                <h1 className="ds2-b24 text-gray-900">What is your main goal on Meetup?</h1>
                <p className="ds2-r14 text-gray-500 mt-1">Select all that apply.</p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {GOAL_OPTIONS.map((g) => {
                  const active = selectedGoals.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleChip(selectedGoals, setSelectedGoals, g)}
                      className={`px-4 py-2.5 rounded-ds2-max border ds2-m14 transition ${
                        active
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-300 bg-white text-gray-800 hover:border-gray-900'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setCustomGoalOpen(!customGoalOpen)}
                  className="px-4 py-2.5 rounded-ds2-max border border-dashed border-gray-400 ds2-m14 text-gray-700 hover:border-gray-900 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Something else
                </button>
              </div>

              {customGoalOpen && (
                <div className="flex items-center gap-2 p-3 rounded-ds2-16 bg-gray-50 border border-gray-200">
                  <input
                    type="text"
                    value={customGoalText}
                    onChange={(e) => setCustomGoalText(e.target.value)}
                    placeholder="Type your custom goal (e.g. AI Engineering)..."
                    className="flex-1 bg-white px-3 py-2 rounded-ds2-12 border border-gray-300 ds2-r14"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customGoalText.trim()) {
                        setSelectedGoals([...selectedGoals, customGoalText.trim()]);
                        setCustomGoalText('');
                        setCustomGoalOpen(false);
                      }
                    }}
                    className="px-4 py-2 rounded-ds2-max bg-gray-900 text-white ds2-m13"
                  >
                    Add
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={async () => {
                  await gqlRequest('updateMemberData', { input: { lookingFor: selectedGoals } });
                  goToStep('people');
                }}
                className="w-full py-3.5 rounded-ds2-max bg-gray-900 text-white ds2-b16"
              >
                Continue
              </button>
            </div>
          )}

          {stepSlug === 'people' && (
            <div className="space-y-6">
              <div>
                <h1 className="ds2-b24 text-gray-900">Who are you hoping to meet?</h1>
                <p className="ds2-r14 text-gray-500 mt-1">Select all the communities you want to connect with.</p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {PEOPLE_OPTIONS.map((p) => {
                  const active = selectedPeople.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleChip(selectedPeople, setSelectedPeople, p)}
                      className={`px-4 py-2.5 rounded-ds2-max border ds2-m14 transition ${
                        active
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-300 bg-white text-gray-800 hover:border-gray-900'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={async () => {
                  await gqlRequest('updateMemberData', { input: { peopleToMeet: selectedPeople } });
                  goToStep('hangout');
                }}
                className="w-full py-3.5 rounded-ds2-max bg-gray-900 text-white ds2-b16"
              >
                Continue
              </button>
            </div>
          )}

          {stepSlug === 'hangout' && (
            <div className="space-y-6">
              <div>
                <h1 className="ds2-b24 text-gray-900">How do you like to hang out?</h1>
                <p className="ds2-r14 text-gray-500 mt-1">Choose your favorite activity formats.</p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {HANGOUT_OPTIONS.map((h) => {
                  const active = selectedHangouts.includes(h);
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => toggleChip(selectedHangouts, setSelectedHangouts, h)}
                      className={`px-4 py-2.5 rounded-ds2-max border ds2-m14 transition ${
                        active
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-300 bg-white text-gray-800 hover:border-gray-900'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={async () => {
                  await gqlRequest('updateMemberData', { input: { hangoutStyles: selectedHangouts } });
                  goToStep('interests');
                }}
                className="w-full py-3.5 rounded-ds2-max bg-gray-900 text-white ds2-b16"
              >
                Continue
              </button>
            </div>
          )}

          {stepSlug === 'interests' && (
            <div className="space-y-6">
              <div>
                <h1 className="ds2-b24 text-gray-900">Pick at least 3 interests</h1>
                <p className="ds2-r14 text-gray-500 mt-1">
                  Selected ({selectedTopics.length}): We use these topics to recommend groups and events.
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={topicQuery}
                  onChange={(e) => setTopicQuery(e.target.value)}
                  placeholder="Search for interests (e.g. AI, Python, Hiking)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-ds2-max border border-gray-300 ds2-r14 focus:outline-none focus:border-gray-900"
                />
              </div>

              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-1">
                {visibleTopics.map((t: any) => {
                  const active = selectedTopics.includes(t.name);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleChip(selectedTopics, setSelectedTopics, t.name)}
                      className={`px-3.5 py-2 rounded-ds2-max border ds2-m13 flex items-center gap-1.5 transition ${
                        active
                          ? 'border-[#00798A] bg-[#00798A] text-white'
                          : 'border-gray-300 bg-white text-gray-800 hover:border-gray-900'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {t.name}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={selectedTopics.length < 3}
                onClick={async () => {
                  await gqlRequest('followTopics', {
                    input: {
                      topicIds: topics
                        .filter((t: any) => selectedTopics.includes(t.name))
                        .map((t: any) => t.id),
                    },
                  });
                  goToStep('age');
                }}
                className="w-full py-3.5 rounded-ds2-max bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white ds2-b16 transition"
              >
                Continue ({selectedTopics.length}/3 minimum)
              </button>
            </div>
          )}

          {stepSlug === 'age' && (
            <div className="space-y-6">
              <div>
                <h1 className="ds2-b24 text-gray-900">When is your birthday?</h1>
                <p className="ds2-r14 text-gray-500 mt-1">
                  This helps us recommend age-appropriate social groups (like 20s & 30s mixers).
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block ds2-m12 text-gray-500 mb-1">Month (MM)</label>
                  <input
                    type="text"
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    placeholder="MM"
                    className="w-full px-4 py-3 rounded-ds2-12 border border-gray-300 ds2-b16 text-center"
                  />
                </div>
                <div>
                  <label className="block ds2-m12 text-gray-500 mb-1">Day (DD)</label>
                  <input
                    type="text"
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    placeholder="DD"
                    className="w-full px-4 py-3 rounded-ds2-12 border border-gray-300 ds2-b16 text-center"
                  />
                </div>
                <div>
                  <label className="block ds2-m12 text-gray-500 mb-1">Year (YYYY)</label>
                  <input
                    type="text"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    placeholder="YYYY"
                    className="w-full px-4 py-3 rounded-ds2-12 border border-gray-300 ds2-b16 text-center"
                  />
                </div>
              </div>

              {ageError && (
                <p className="ds2-m13 text-rose-600 bg-rose-50 px-3 py-2 rounded-ds2-12">{ageError}</p>
              )}

              <button
                type="button"
                onClick={handleValidateAndNextAge}
                className="w-full py-3.5 rounded-ds2-max bg-gray-900 text-white ds2-b16"
              >
                Continue
              </button>
            </div>
          )}

          {stepSlug === 'gender' && (
            <div className="space-y-6">
              <div>
                <h1 className="ds2-b24 text-gray-900">What is your gender?</h1>
                <p className="ds2-r14 text-gray-500 mt-1">Used for women-only, men-only, or LGBTQ+ group recommendations.</p>
              </div>

              <div className="space-y-2.5" role="radiogroup">
                {['Woman', 'Man', 'Non-binary', 'Prefer not to say'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={gender === g}
                    onClick={() => setGender(g)}
                    className={`w-full p-4 rounded-ds2-16 border-2 text-left ds2-b16 flex items-center justify-between ${
                      gender === g ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <span>{g}</span>
                    {gender === g && <Check className="w-4 h-4 text-gray-900" />}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={async () => {
                  await gqlRequest('updateMemberData', { input: { gender } });
                  goToStep('sms-number');
                }}
                className="w-full py-3.5 rounded-ds2-max bg-gray-900 text-white ds2-b16"
              >
                Continue
              </button>
            </div>
          )}

          {(stepSlug === 'sms-number' || stepSlug === 'whatsapp-number') && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-ds2-16 bg-teal-50 text-[#00798A]">
                  {stepSlug === 'sms-number' ? <Phone className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                </div>
                <div>
                  <h1 className="ds2-b24 text-gray-900">
                    {stepSlug === 'sms-number'
                      ? 'Get SMS event reminders'
                      : 'Connect your WhatsApp number'}
                  </h1>
                  <p className="ds2-r14 text-gray-500">Never miss a last-minute venue update from event hosts.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <select
                  aria-label="Country dial code"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-3 py-3 rounded-ds2-12 border border-gray-300 ds2-m14 bg-white"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Phone number"
                  className="flex-1 px-4 py-3 rounded-ds2-12 border border-gray-300 ds2-r16"
                />
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    await gqlRequest('updateMemberData', {
                      input:
                        stepSlug === 'sms-number'
                          ? { phone: `${countryCode} ${phoneInput}` }
                          : { whatsappPhone: `${countryCode} ${phoneInput}` },
                    });
                    goToStep(stepSlug === 'sms-number' ? 'whatsapp-number' : 'intro-paywall');
                  }}
                  className="w-full py-3.5 rounded-ds2-max bg-gray-900 text-white ds2-b16"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(stepSlug === 'sms-number' ? 'whatsapp-number' : 'intro-paywall')}
                  className="w-full py-2.5 rounded-ds2-max text-gray-500 hover:text-gray-900 ds2-m14"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {stepSlug === 'intro-paywall' && (
            <div className="space-y-5">
              <div className="p-4 rounded-ds2-20 bg-gradient-to-r from-[#141416] via-[#3B0764] to-[#D91B5C] text-white">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 ds2-m11 uppercase">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Meetup+ 7-Day Free Trial
                </span>
                <h1 className="ds2-b24 mt-2">Unlock the full Meetup+ experience</h1>
                <p className="ds2-r14 text-white/85 mt-1">
                  See full attendee lists & profiles, get priority waitlist access, and message anyone.
                </p>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-ds2-16 bg-gray-50 border border-gray-200">
                <span className="ds2-m14 text-gray-800">Free trial enabled (7 days free)</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={freeTrialSwitch}
                  onClick={() => setFreeTrialSwitch(!freeTrialSwitch)}
                  className={`w-12 h-7 rounded-full p-1 flex items-center transition ${
                    freeTrialSwitch ? 'bg-[#00798A] justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaywallPlan('YEARLY')}
                  className={`p-3.5 rounded-ds2-16 border-2 text-left ${
                    paywallPlan === 'YEARLY' ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                  }`}
                >
                  <p className="ds2-b16">Yearly (Save 25%)</p>
                  <p className="ds2-r12 text-gray-500 mt-0.5">$10.83/mo ($129.99/yr)</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaywallPlan('MONTHLY')}
                  className={`p-3.5 rounded-ds2-16 border-2 text-left ${
                    paywallPlan === 'MONTHLY' ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                  }`}
                >
                  <p className="ds2-b16">Monthly</p>
                  <p className="ds2-r12 text-gray-500 mt-0.5">$14.99/mo</p>
                </button>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await gqlRequest('subscribeMeetupPlus', { input: { plan: paywallPlan } });
                    goToStep('groups');
                  }}
                  className="w-full py-3.5 rounded-ds2-max bg-gray-900 text-white ds2-b16"
                >
                  Start 7-day free trial
                </button>
                <button
                  type="button"
                  onClick={() => goToStep('groups')}
                  className="w-full py-2.5 rounded-ds2-max text-gray-600 hover:text-gray-900 ds2-m14"
                >
                  Continue with free plan
                </button>
              </div>
            </div>
          )}

          {stepSlug === 'groups' && (
            <div className="space-y-6">
              <div>
                <h1 className="ds2-b24 text-gray-900">Join groups in your area</h1>
                <p className="ds2-r14 text-gray-500 mt-1">
                  Recommended in San Francisco, CA based on your selected interests.
                </p>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {suggestedGroups.map((g: any) => {
                  const isJoined = joinedIds.includes(g.id);
                  return (
                    <div
                      key={g.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-ds2-16 border border-gray-200 hover:border-gray-400 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={g.coverImage}
                          alt={g.name}
                          className="w-14 h-14 rounded-ds2-12 object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="ds2-b16 text-gray-900 truncate">{g.name}</p>
                          <p className="ds2-r12 text-gray-500">
                            {g.city}, {g.state} · {g.membersCount.toLocaleString()} members · ★ {g.rating}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (isJoined) {
                            await gqlRequest('leaveGroup', { input: { groupId: g.id } });
                            setJoinedIds(joinedIds.filter((id) => id !== g.id));
                          } else {
                            await gqlRequest('joinGroup', { input: { groupId: g.id } });
                            setJoinedIds([...joinedIds, g.id]);
                          }
                        }}
                        className={`px-4 py-2 rounded-ds2-max ds2-b12 shrink-0 transition ${
                          isJoined
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-gray-900 text-white hover:bg-black'
                        }`}
                      >
                        {isJoined ? 'Joined ✓' : '+ Join'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="w-full py-3.5 rounded-ds2-max bg-[#E51937] hover:bg-[#c8142f] text-white ds2-b16 transition"
              >
                Finish & Explore Meetup
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const stepArr = ctx.params?.step;
  const initialStep = Array.isArray(stepArr) ? stepArr[0] : 'intent';

  const topics = await prisma.topic.findMany({
    orderBy: { followersCount: 'desc' },
  });
  const suggestedGroups = await prisma.group.findMany({
    where: { isDraft: false },
    orderBy: { membersCount: 'desc' },
  });
  const joinedGroupIds = user
    ? user.memberships.map((m: any) => m.groupId)
    : [];

  return {
    props: {
      initialStep,
      topics: JSON.parse(JSON.stringify(topics)),
      suggestedGroups: JSON.parse(JSON.stringify(suggestedGroups)),
      joinedGroupIds,
    },
  };
};
