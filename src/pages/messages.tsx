import React, { useState } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { Send, Search, MessageSquare } from 'lucide-react';
import Layout from '@/components/Layout';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function MessagesPage({
  user,
  peers,
  initialMessages,
}: {
  user: any;
  peers: any[];
  initialMessages: any[];
}) {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedPeer, setSelectedPeer] = useState<any>(peers[0] || null);
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [draft, setDraft] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !selectedPeer) return;
    const res = await gqlRequest('sendMessage', {
      input: { receiverId: selectedPeer.id, body: draft },
    });
    const sent = res?.data?.sendMessage?.message;
    if (sent) {
      setMessages([...messages, sent]);
      setDraft('');
    }
  };

  const visiblePeers = peers.filter((p) => {
    if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'UNREAD') {
      return messages.some((m) => m.senderId === p.id && !m.isRead);
    }
    return true;
  });

  const activeThreadMessages = messages.filter(
    (m) =>
      selectedPeer &&
      ((m.senderId === selectedPeer.id && m.receiverId === user.id) ||
        (m.senderId === user.id && m.receiverId === selectedPeer.id))
  );

  return (
    <Layout user={user}>
      <Head>
        <title>Messages | Meetup</title>
      </Head>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-6">
        <div className="bg-white rounded-ds2-28 border border-gray-200 overflow-hidden shadow-ds2-sm grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
          {/* Left Conversations Sidebar */}
          <aside className="md:col-span-4 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="ds2-b24 text-gray-900">Messages</h1>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-ds2-max">
                  <button
                    type="button"
                    onClick={() => setFilter('ALL')}
                    className={`px-3 py-1 rounded-ds2-max ds2-m12 ${
                      filter === 'ALL' ? 'bg-white shadow-xs font-bold text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('UNREAD')}
                    className={`px-3 py-1 rounded-ds2-max ds2-m12 ${
                      filter === 'UNREAD' ? 'bg-white shadow-xs font-bold text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    Unread
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full pl-9 pr-3 py-2 rounded-ds2-max bg-gray-50 border border-gray-200 ds2-r14"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {visiblePeers.map((peer) => {
                const lastMsg = [...messages]
                  .reverse()
                  .find((m) => m.senderId === peer.id || m.receiverId === peer.id);
                const isSelected = selectedPeer?.id === peer.id;
                return (
                  <button
                    key={peer.id}
                    type="button"
                    onClick={() => setSelectedPeer(peer)}
                    className={`w-full p-4 text-left flex items-start gap-3 transition ${
                      isSelected ? 'bg-teal-50/70' : 'hover:bg-gray-50'
                    }`}
                  >
                    <img
                      src={peer.avatarUrl}
                      alt={peer.name}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="ds2-b16 text-gray-900 truncate">{peer.name}</p>
                        {lastMsg && !lastMsg.isRead && lastMsg.senderId === peer.id && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#E51937]" />
                        )}
                      </div>
                      <p className="ds2-r12 text-gray-500 truncate mt-0.5">
                        {lastMsg?.body || 'Start a conversation'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Conversation Thread */}
          <div className="md:col-span-8 flex flex-col justify-between">
            {selectedPeer ? (
              <>
                <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                  <img
                    src={selectedPeer.avatarUrl}
                    alt={selectedPeer.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="ds2-b16 text-gray-900">{selectedPeer.name}</h2>
                    <p className="ds2-r12 text-gray-500">{selectedPeer.city}, {selectedPeer.state}</p>
                  </div>
                </div>

                <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50/50">
                  {activeThreadMessages.map((msg) => {
                    const isMine = msg.senderId === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-md px-4 py-3 rounded-ds2-20 ds2-r14 ${
                            isMine
                              ? 'bg-[#00798A] text-white'
                              : 'bg-white border border-gray-200 text-gray-800'
                          }`}
                        >
                          <p>{msg.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={handleSend}
                  className="p-4 border-t border-gray-200 bg-white flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Write a message to ${selectedPeer.name}...`}
                    className="flex-1 px-4 py-2.5 rounded-ds2-max border border-gray-300 ds2-r14"
                  />
                  <button
                    type="submit"
                    aria-label="Send message"
                    className="px-5 py-2.5 rounded-ds2-max bg-gray-900 hover:bg-black text-white ds2-b16 flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: '/login', permanent: false } };

  const peers = await prisma.user.findMany({
    where: { NOT: { id: user.id } },
  });

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
    orderBy: { createdAt: 'asc' },
  });

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      peers: JSON.parse(JSON.stringify(peers)),
      initialMessages: JSON.parse(JSON.stringify(messages)),
    },
  };
};
