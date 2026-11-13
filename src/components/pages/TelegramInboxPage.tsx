import React, { useMemo, useState } from 'react';
import { ArrowLeft, Info, Search, Send } from 'lucide-react';
import { formatDateTime } from '../../lib/date';
import { useCrm } from '../../store/CrmContext';
import { EmptyState } from '../ui/EmptyState';

export function TelegramInboxPage() {
  const { state, markThreadRead, sendTelegramReply } = useCrm();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(
    state.telegramThreads[0]?.id ?? null
  );
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [replyText, setReplyText] = useState('');

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...state.telegramThreads]
      .filter((t) => {
        if (!q) return true;
        return (
          t.customerName.toLowerCase().includes(q) ||
          t.handle.toLowerCase().includes(q) ||
          t.topic.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }, [state.telegramThreads, search]);

  const activeThread = useMemo(
    () => state.telegramThreads.find((t) => t.id === selectedId) ?? filteredThreads[0] ?? null,
    [state.telegramThreads, selectedId, filteredThreads]
  );

  const selectThread = (id: string) => {
    setSelectedId(id);
    markThreadRead(id);
    setMobileView('chat');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim()) return;
    sendTelegramReply(activeThread.id, replyText);
    setReplyText('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Telegram inbox
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Customer inquiry threads and local simulated replies.
        </p>
      </div>

      <div
        className="px-4 py-2.5 rounded-xl border flex items-start gap-2.5 text-xs"
        style={{
          backgroundColor: 'var(--info-bg)',
          borderColor: 'var(--info-border)',
          color: 'var(--info-fg)',
        }}
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          <strong>Demo messaging mode:</strong> Replies sent here are saved locally as simulated demo messages. Connect your Telegram Bot webhook on the Django backend for live delivery.
        </span>
      </div>

      <div
        className="rounded-xl border overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[520px]"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Conversation List */}
        <div
          className={`md:col-span-5 lg:col-span-4 border-r flex flex-col ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="p-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="relative">
              <Search
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="search"
                aria-label="Search Telegram conversations"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer or @handle..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {filteredThreads.length === 0 ? (
              <div className="p-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                No conversations match &ldquo;{search}&rdquo;.
              </div>
            ) : (
              filteredThreads.map((t) => {
                const selected = activeThread?.id === t.id;
                const lastMsg = t.messages[t.messages.length - 1];
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectThread(t.id)}
                    className="w-full text-left px-4 py-3.5 transition-colors space-y-1"
                    style={{
                      backgroundColor: selected ? 'var(--accent-soft)' : 'transparent',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {t.customerName}
                      </span>
                      {t.unreadCount > 0 && (
                        <span
                          className="px-1.5 py-0.5 text-[10px] font-bold rounded-full tabular-nums shrink-0"
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: 'var(--accent-fg)',
                          }}
                        >
                          {t.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] flex items-center justify-between gap-2" style={{ color: 'var(--text-muted)' }}>
                      <span className="truncate">{t.handle} · {t.topic}</span>
                    </div>
                    {lastMsg && (
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        {lastMsg.text}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message Panel */}
        <div
          className={`md:col-span-7 lg:col-span-8 flex flex-col ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {!activeThread ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <EmptyState
                icon={Send}
                title="Select a conversation"
                description="Choose a Telegram thread from the left to inspect messages and send a simulated reply."
              />
            </div>
          ) : (
            <>
              <div
                className="px-4 py-3 border-b flex items-center justify-between gap-3"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileView('list')}
                    aria-label="Back to conversations"
                    className="md:hidden p-1.5 rounded-lg border shrink-0"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {activeThread.customerName}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {activeThread.handle} · {activeThread.topic}
                    </div>
                  </div>
                </div>
                <span
                  className="text-[11px] px-2 py-0.5 rounded border shrink-0"
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Simulated demo thread
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeThread.messages.map((m) => {
                  const isAgent = m.sender === 'agent';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className="max-w-[85%] sm:max-w-[75%] px-3.5 py-2.5 rounded-xl border text-xs leading-relaxed"
                        style={{
                          backgroundColor: isAgent
                            ? 'var(--accent-soft)'
                            : 'var(--bg-surface-subtle)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <div className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                          {m.senderName} {isAgent ? '· Simulated reply' : ''}
                        </div>
                        <p>{m.text}</p>
                      </div>
                      <span className="text-[10px] mt-1 px-1" style={{ color: 'var(--text-muted)' }}>
                        {formatDateTime(m.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleSend}
                className="p-3 border-t flex items-center gap-2"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <input
                  type="text"
                  aria-label="Simulated Telegram reply"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a simulated local reply..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg disabled:opacity-50 whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-fg)',
                  }}
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  Send demo reply
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
