'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { MessageSquare, Send, User, Phone, CheckCircle } from 'lucide-react';
import {
  SUPPORT_CONVERSATIONS,
  SUPPORT_CONVERSATION_DETAIL,
  SEND_AGENT_SUPPORT_MESSAGE,
  CLOSE_SUPPORT_CONVERSATION,
  SUPPORT_MESSAGE_ADDED_SUB,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';

interface Conv {
  id: number;
  riderId: number;
  riderName?: string;
  riderPhone?: string;
  status: string;
  lastMessage?: string;
  unreadCount: number;
}
interface Msg {
  id: number;
  senderType: string;
  body: string;
  createdAt: string;
}

const CANNED = [
  'مرحباً، كيف يمكنني مساعدتك؟',
  'نعتذر عن الإزعاج، نعمل على حلّ مشكلتك الآن.',
  'تم حلّ المشكلة، هل تحتاج شيئاً آخر؟',
  'شكراً لتواصلك مع HANCR 🙏',
];

export default function SupportPanelPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data, refetch } = useQuery(SUPPORT_CONVERSATIONS, {
    pollInterval: 15000,
  });
  const conversations: Conv[] = data?.supportConversations ?? [];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Topbar title="الدعم المباشر" />
      <div className="flex-1 flex overflow-hidden">
        {/* الطابور */}
        <div className="w-80 border-e border-gray-200 bg-white overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-12">لا محادثات</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full text-start px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                selectedId === c.id ? 'bg-violet-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 text-sm">
                  {c.riderName ?? `راكب #${c.riderId}`}
                </span>
                {c.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] rounded-full px-2 py-0.5">
                    {c.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {c.lastMessage ?? '—'}
              </p>
              <span
                className={`text-[10px] ${
                  c.status === 'open'
                    ? 'text-amber-600'
                    : c.status === 'closed'
                      ? 'text-gray-400'
                      : 'text-emerald-600'
                }`}
              >
                {c.status}
              </span>
            </button>
          ))}
        </div>

        {/* المحادثة */}
        <div className="flex-1 flex flex-col">
          {selectedId == null ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-40" />
                اختر محادثة من الطابور
              </div>
            </div>
          ) : (
            <ConversationThread
              key={selectedId}
              id={selectedId}
              onChanged={refetch}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationThread({
  id,
  onChanged,
}: {
  id: number;
  onChanged: () => void;
}) {
  const { data, refetch } = useQuery(SUPPORT_CONVERSATION_DETAIL, {
    variables: { id },
    fetchPolicy: 'network-only',
  });
  const [send, { loading: sending }] = useMutation(SEND_AGENT_SUPPORT_MESSAGE, {
    onCompleted: () => {
      setBody('');
      refetch();
      onChanged();
    },
  });
  const [close] = useMutation(CLOSE_SUPPORT_CONVERSATION, {
    onCompleted: () => {
      refetch();
      onChanged();
    },
  });
  const [body, setBody] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useSubscription(SUPPORT_MESSAGE_ADDED_SUB, {
    variables: { conversationId: id },
    onData: () => refetch(),
  });

  const c = data?.supportConversationDetail;
  const messages: Msg[] = c?.messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!c) return <div className="flex-1 p-8 text-gray-400">جارٍ التحميل…</div>;

  const doSend = (text: string) => {
    if (!text.trim()) return;
    send({ variables: { conversationId: id, body: text.trim() } });
  };

  return (
    <div className="flex-1 flex">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
          {messages.map((m) => {
            const agent = m.senderType === 'agent';
            return (
              <div
                key={m.id}
                className={`flex ${agent ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                    agent
                      ? 'bg-violet-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        {/* canned + input */}
        <div className="border-t border-gray-200 bg-white p-3">
          <div className="flex gap-2 flex-wrap mb-2">
            {CANNED.map((t) => (
              <button
                key={t}
                onClick={() => doSend(t)}
                className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1 text-gray-600"
              >
                {t.length > 24 ? `${t.slice(0, 24)}…` : t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSend(body)}
              placeholder="اكتب ردّاً…"
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm"
            />
            <button
              disabled={sending || !body.trim()}
              onClick={() => doSend(body)}
              className="bg-violet-600 text-white rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* sidebar سياق المستخدم */}
      <div className="w-64 border-s border-gray-200 bg-white p-4 hidden lg:block">
        <h3 className="font-bold text-gray-900 mb-3">سياق الراكب</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <User className="w-4 h-4 text-gray-400" />
            {c.riderName ?? `#${c.riderId}`}
          </div>
          {c.riderPhone && (
            <a
              href={`tel:${c.riderPhone}`}
              className="flex items-center gap-2 text-violet-600"
            >
              <Phone className="w-4 h-4" />
              {c.riderPhone}
            </a>
          )}
          <div className="text-xs text-gray-400">الحالة: {c.status}</div>
        </div>
        {c.status !== 'closed' && (
          <button
            onClick={() => close({ variables: { conversationId: id } })}
            className="mt-6 w-full flex items-center justify-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg py-2 text-gray-700"
          >
            <CheckCircle className="w-4 h-4" />
            إغلاق المحادثة
          </button>
        )}
      </div>
    </div>
  );
}
