import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Lock, Mail, Sparkles, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('wlfjck@gmail.com');
  const [password, setPassword] = useState('meetup2026');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-[#FCFCFD] flex flex-col justify-center items-center p-4">
      <Head>
        <title>Log in | Meetup</title>
      </Head>

      <div className="max-w-md w-full bg-white rounded-ds2-28 shadow-ds2-lg-default border border-gray-200 p-8">
        <div className="text-center mb-6">
          <Link href="/home" className="font-black text-3xl tracking-tighter text-[#E51937] lowercase">
            meetup.
          </Link>
          <h1 className="ds2-b24 text-gray-900 mt-3">Log in to Meetup</h1>
          <p className="ds2-r14 text-gray-500 mt-1">
            Authenticated via NextAuth + Prisma (`Member:484670701`)
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block ds2-m13 text-gray-700 mb-1">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14 focus:outline-none focus:border-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block ds2-m13 text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14 focus:outline-none focus:border-gray-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-ds2-max bg-[#E51937] hover:bg-[#c8142f] text-white ds2-b16 flex items-center justify-center gap-2 transition"
          >
            {loading ? 'Signing in...' : 'Log in'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-2">
          <Link
            href="/welcome/intent"
            className="inline-flex items-center gap-1.5 ds2-m14 text-[#00798A] hover:underline"
          >
            <Sparkles className="w-4 h-4" />
            Launch 14-Step Onboarding Wizard (/welcome/intent)
          </Link>
        </div>
      </div>
    </div>
  );
}
