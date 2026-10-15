import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import {
  MapPin,
  Sparkles,
  Check,
  ArrowLeft,
  ShieldCheck,
  Search,
  Wand2,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function StartGroupWizardPage({
  user,
  topics,
}: {
  user: any;
  topics: any[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [location, setLocation] = useState('San Francisco, CA');
  const [editingLocation, setEditingLocation] = useState(false);
  const [topicSearch, setTopicSearch] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    'New Technology',
    'Artificial Intelligence',
    'Python',
    'Software Development',
  ]);
  const [groupName, setGroupName] = useState('SF AI & Creative Builders Meetup');
  const [description, setDescription] = useState(
    'Welcome to the SF AI & Creative Builders Meetup! We bring together software engineers, designers, founders, and curious learners in San Francisco for weekly hands-on coding nights, lightning demos, and warm community networking.'
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'SIX_MONTHS' | 'MONTHLY'>('SIX_MONTHS');
  const [selectedPlan, setSelectedPlan] = useState<'STANDARD' | 'PRO'>('STANDARD');

  const progressPct = Math.round((step / 6) * 100);

  const toggleTopic = (name: string) => {
    if (selectedTopics.includes(name)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== name));
    } else if (selectedTopics.length < 15) {
      setSelectedTopics([...selectedTopics, name]);
    }
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const res = await gqlRequest('generateGroupDescriptionAI', {
        input: {
          groupName,
          location,
          topics: selectedTopics,
        },
      });
      const generated = res?.data?.generateGroupDescriptionAI?.description;
      if (generated) {
        setDescription(generated.replace(/<[^>]+>/g, '\n').trim());
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveStep = async (nextStep: number, isDraft = true) => {
    const [city, state] = location.split(',').map((s) => s.trim());
    await gqlRequest('createOrUpdateDraftGroup', {
      input: {
        name: groupName,
        city: city || 'San Francisco',
        state: state || 'CA',
        description,
        isDraft,
        wizardStep: nextStep,
      },
    });
    setStep(nextStep);
  };

  const filteredTopics = topicSearch.trim()
    ? topics.filter((t) => t.name.toLowerCase().includes(topicSearch.toLowerCase()))
    : topics;

  return (
    <div className="min-h-screen bg-[#FCFCFD] flex flex-col">
      <Head>
        <title>Start a new Meetup group — Step {step} of 6</title>
      </Head>

      {/* Top Wizard Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home" className="font-black text-2xl text-[#E51937] lowercase">
              meetup.
            </Link>
            <span className="ds2-m13 text-gray-500">
              Step {step} of 6 · Start a new group
            </span>
          </div>
          <Link
            href="/home"
            className="px-4 py-1.5 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-m13 text-gray-700"
          >
            Save & exit
          </Link>
        </div>
        <div className="max-w-4xl mx-auto mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00798A] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Step Quick Switcher Bar */}
      <div className="bg-gray-50 border-b border-gray-200 py-2 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { n: 1, label: '1. Location' },
            { n: 2, label: '2. Topics' },
            { n: 3, label: '3. Group Name' },
            { n: 4, label: '4. Description & AI' },
            { n: 5, label: '5. Guidelines' },
            { n: 6, label: '6. Plan & Launch' },
          ].map((item) => (
            <button
              key={item.n}
              type="button"
              onClick={() => setStep(item.n)}
              className={`px-3 py-1 rounded-ds2-max ds2-m12 shrink-0 transition ${
                step === item.n
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-ds2-28 border border-gray-200 p-8 shadow-ds2-sm space-y-6">
          {/* STEP 1: LOCATION */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="ds2-k13 text-[#00798A] uppercase">Step 1 of 6</p>
                <h1 className="ds2-b28 text-gray-900 mt-1">
                  First, set your group&apos;s location
                </h1>
                <p className="ds2-r16 text-gray-600 mt-1">
                  Meetup groups meet locally, in person and online. We&apos;ll connect you with people in your area.
                </p>
              </div>

              <div className="p-5 rounded-ds2-20 bg-gray-50 border border-gray-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-[#E51937]" />
                  {editingLocation ? (
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-300 ds2-b16 bg-white"
                    />
                  ) : (
                    <span className="ds2-b20 text-gray-900">{location}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setEditingLocation(!editingLocation)}
                  className="ds2-b16 text-[#00798A] hover:underline"
                >
                  {editingLocation ? 'Done' : 'Change location'}
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveStep(2)}
                  className="px-8 py-3.5 rounded-ds2-max bg-[#E51937] hover:bg-[#c8142f] text-white ds2-b16"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TOPICS */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="ds2-k13 text-[#00798A] uppercase">Step 2 of 6</p>
                <h1 className="ds2-b28 text-gray-900 mt-1">
                  Choose a few topics that describe your group&apos;s interests
                </h1>
                <p className="ds2-r14 text-gray-500 mt-1">
                  Be specific! This helps us promote your group to the right people. Selected: {selectedTopics.length}/15
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                  placeholder="Search for topics..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-ds2-max border border-gray-300 ds2-r14"
                />
              </div>

              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-1">
                {filteredTopics.map((t: any) => {
                  const active = selectedTopics.includes(t.name);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTopic(t.name)}
                      className={`px-3.5 py-2 rounded-ds2-max border ds2-m13 transition ${
                        active
                          ? 'bg-[#00798A] border-[#00798A] text-white'
                          : 'bg-white border-gray-300 text-gray-800 hover:border-gray-900'
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-ds2-max border border-gray-300 ds2-m14 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={selectedTopics.length === 0}
                  onClick={() => handleSaveStep(3)}
                  className="px-8 py-3.5 rounded-ds2-max bg-[#E51937] text-white ds2-b16"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: GROUP NAME */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="ds2-k13 text-[#00798A] uppercase">Step 3 of 6</p>
                <h1 className="ds2-b28 text-gray-900 mt-1">
                  What will your group&apos;s name be?
                </h1>
                <p className="ds2-r14 text-gray-500 mt-1">
                  Choose a name that will give people a clear idea of what the group is about.
                </p>
              </div>

              <div>
                <label className="block ds2-m13 text-gray-700 mb-1.5">Group name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. SF AI & LLM Builders"
                  className="w-full px-4 py-3 rounded-ds2-16 border border-gray-300 ds2-b16"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-ds2-max border border-gray-300 ds2-m14 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={!groupName.trim()}
                  onClick={() => handleSaveStep(4)}
                  className="px-8 py-3.5 rounded-ds2-max bg-[#E51937] text-white ds2-b16"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: DESCRIPTION + GENERATE WITH AI */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="ds2-k13 text-[#00798A] uppercase">Step 4 of 6</p>
                  <h1 className="ds2-b28 text-gray-900 mt-1">
                    Now describe what your group will be about
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                  className="px-4 py-2.5 rounded-ds2-max bg-gradient-to-r from-[#00798A] to-indigo-600 text-white ds2-b12 flex items-center gap-1.5 shrink-0 shadow-xs hover:opacity-95 transition"
                >
                  <Wand2 className="w-4 h-4" />
                  {aiLoading ? 'Generating...' : 'Generate Description with AI'}
                </button>
              </div>

              <div>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your group's mission, who should join, and what happens at your events (at least 50 characters)..."
                  className="w-full px-4 py-3 rounded-ds2-16 border border-gray-300 ds2-r14 leading-relaxed"
                />
                <p className="ds2-r12 text-gray-500 mt-1">
                  {description.length} characters (minimum 50 characters required)
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-ds2-max border border-gray-300 ds2-m14 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={description.length < 50}
                  onClick={() => handleSaveStep(5)}
                  className="px-8 py-3.5 rounded-ds2-max bg-[#E51937] disabled:bg-gray-200 text-white ds2-b16"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: COMMUNITY GUIDELINES */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <p className="ds2-k13 text-[#00798A] uppercase">Step 5 of 6</p>
                <h1 className="ds2-b28 text-gray-900 mt-1">
                  Almost done! Just take a minute to review our guidelines
                </h1>
              </div>

              <div className="space-y-3 bg-gray-50 rounded-ds2-20 p-5 border border-gray-200">
                {[
                  'Real, human-to-human connections are at the heart of every Meetup event.',
                  'All groups are safe, welcoming, and respectful spaces for members.',
                  'Organizers commit to transparent event descriptions and accurate locations.',
                ].map((rule) => (
                  <div key={rule} className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#00798A] shrink-0 mt-0.5" />
                    <p className="ds2-r14 text-gray-700">{rule}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 rounded-ds2-max border border-gray-300 ds2-m14 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveStep(6)}
                  className="px-8 py-3.5 rounded-ds2-max bg-[#E51937] text-white ds2-b16"
                >
                  Agree & Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: ORGANIZER SUBSCRIPTION PLAN SELECTION */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="p-4 rounded-ds2-20 bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="ds2-b16 text-emerald-900">
                  🎉 Special Launch Offer: Save 30% on your first Organizer Subscription!
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-700 text-white ds2-b12">
                  30% OFF
                </span>
              </div>

              <div className="flex items-center justify-between">
                <h1 className="ds2-b24 text-gray-900">Choose your Organizer plan</h1>
                <div className="flex items-center bg-gray-100 p-1 rounded-ds2-max">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('SIX_MONTHS')}
                    className={`px-3 py-1.5 rounded-ds2-max ds2-m12 ${
                      billingCycle === 'SIX_MONTHS' ? 'bg-white shadow-xs text-gray-900 font-bold' : 'text-gray-600'
                    }`}
                  >
                    6 Months (Best Value)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('MONTHLY')}
                    className={`px-3 py-1.5 rounded-ds2-max ds2-m12 ${
                      billingCycle === 'MONTHLY' ? 'bg-white shadow-xs text-gray-900 font-bold' : 'text-gray-600'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedPlan('STANDARD')}
                  className={`p-5 rounded-ds2-20 border-2 text-left space-y-2 transition ${
                    selectedPlan === 'STANDARD' ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                  }`}
                >
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00798A] text-white ds2-b12">
                    Most Popular
                  </span>
                  <h3 className="ds2-b20 text-gray-900">Standard Organizer</h3>
                  <p className="ds2-b24 text-gray-900">
                    {billingCycle === 'SIX_MONTHS' ? '$20.99/mo' : '$29.99/mo'}
                  </p>
                  <ul className="space-y-1.5 pt-2 ds2-r12 text-gray-600">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" /> Unlimited members & events
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" /> Promoted to local members
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" /> Co-organizers & ticket fees
                    </li>
                  </ul>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan('PRO')}
                  className={`p-5 rounded-ds2-20 border-2 text-left space-y-2 transition ${
                    selectedPlan === 'PRO' ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                  }`}
                >
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 ds2-b12">
                    Multi-Group Network
                  </span>
                  <h3 className="ds2-b20 text-gray-900">Meetup Pro</h3>
                  <p className="ds2-b24 text-gray-900">$55.00/mo per group</p>
                  <ul className="space-y-1.5 pt-2 ds2-r12 text-gray-600">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" /> Everything in Standard
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" /> Attendee email export & CRM sync
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" /> Network analytics dashboard
                    </li>
                  </ul>
                </button>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await handleSaveStep(6, false);
                  router.push(
                    `/subscription/checkout/core/organizer?plan=${selectedPlan}&cycle=${billingCycle}&group=${encodeURIComponent(
                      groupName
                    )}`
                  );
                }}
                className="w-full py-3.5 rounded-ds2-max bg-[#E51937] hover:bg-[#c8142f] text-white ds2-b16 transition"
              >
                Continue to checkout
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
  const topics = await prisma.topic.findMany({
    orderBy: { followersCount: 'desc' },
  });

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      topics: JSON.parse(JSON.stringify(topics)),
    },
  };
};
