import React, { useMemo, useState } from 'react';
import {
  Info,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Search,
} from 'lucide-react';
import { formatCallSeconds, formatDateTime } from '../../lib/date';
import { useCrm } from '../../store/CrmContext';
import type { CallDirection, CallOutcome, CallRecord } from '../../types/crm';
import { EmptyState } from '../ui/EmptyState';
import { StatusBadge } from '../ui/StatusBadge';

const OUTCOMES: CallOutcome[] = [
  'Quoted itinerary',
  'Booked follow-up',
  'General inquiry',
  'Schedule change',
  'Left voicemail',
  'No answer',
];

export function PhoneCallsPage() {
  const { state, logCall } = useCrm();

  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'All' | CallDirection>('All');
  const [selectedCallId, setSelectedCallId] = useState<string | null>(
    state.calls[0]?.id ?? null
  );

  // Simulated dialer state
  const [dialPhone, setDialPhone] = useState('+998 90 ');
  const [dialName, setDialName] = useState('');
  const [dialOutcome, setDialOutcome] = useState<CallOutcome>('Quoted itinerary');
  const [dialNotes, setDialNotes] = useState('');
  const [dialError, setDialError] = useState('');

  const filteredCalls = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.calls.filter((c) => {
      if (directionFilter !== 'All' && c.direction !== directionFilter) return false;
      if (!q) return true;
      return (
        c.contactName.toLowerCase().includes(q) ||
        c.phoneNumber.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q) ||
        c.outcome.toLowerCase().includes(q)
      );
    });
  }, [state.calls, search, directionFilter]);

  const selectedCall: CallRecord | null = useMemo(
    () => state.calls.find((c) => c.id === selectedCallId) ?? filteredCalls[0] ?? null,
    [state.calls, selectedCallId, filteredCalls]
  );

  const handleSimulatedCall = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = dialPhone.trim();
    if (cleaned.length < 7) {
      setDialError('Enter a phone number to log a simulated call.');
      return;
    }
    setDialError('');
    const created = logCall({
      contactName: dialName.trim() || 'Outbound Contact',
      phoneNumber: cleaned,
      direction: dialOutcome === 'No answer' ? 'Outgoing' : 'Outgoing',
      durationSeconds: dialOutcome === 'No answer' ? 0 : 145,
      outcome: dialOutcome,
      agentName: state.profile.fullName,
      notes:
        dialNotes.trim() ||
        'Simulated outbound call logged locally (no live SIP trunk connected).',
    });
    setSelectedCallId(created.id);
    setDialName('');
    setDialNotes('');
  };

  const renderDirectionIcon = (dir: CallDirection) => {
    if (dir === 'Incoming') return <PhoneIncoming className="w-3.5 h-3.5" style={{ color: 'var(--success-fg)' }} />;
    if (dir === 'Missed') return <PhoneMissed className="w-3.5 h-3.5" style={{ color: 'var(--danger-fg)' }} />;
    return <PhoneOutgoing className="w-3.5 h-3.5" style={{ color: 'var(--info-fg)' }} />;
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Phone calls
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Review incoming, outgoing, and missed call logs or log a simulated call via the demo dialer.
        </p>
      </div>

      <div
        className="px-4 py-3 rounded-xl border flex items-start gap-2.5 text-xs"
        style={{
          backgroundColor: 'var(--info-bg)',
          borderColor: 'var(--info-border)',
          color: 'var(--info-fg)',
        }}
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          <strong>SIP/VoIP not connected:</strong> Live telephony and call recording are unavailable until your SIP/VoIP provider is configured on the Django backend. Use the simulated dialer below to test call logging.
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Call History */}
        <div className="xl:col-span-2 space-y-3">
          <div
            className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="search"
                aria-label="Search call history"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contact, phone number, or outcome..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div
              className="inline-flex items-center p-1 rounded-lg border self-start sm:self-auto"
              style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {(['All', 'Incoming', 'Outgoing', 'Missed'] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setDirectionFilter(dir)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                  style={{
                    backgroundColor: directionFilter === dir ? 'var(--accent)' : 'transparent',
                    color: directionFilter === dir ? 'var(--accent-fg)' : 'var(--text-secondary)',
                  }}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          {filteredCalls.length === 0 ? (
            <EmptyState
              icon={Phone}
              title="No call records found"
              description="Clear the search filter or log a simulated call using the dialer."
            />
          ) : (
            <div
              className="rounded-xl border divide-y overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {filteredCalls.map((call) => {
                const isSelected = selectedCall?.id === call.id;
                return (
                  <button
                    key={call.id}
                    type="button"
                    onClick={() => setSelectedCallId(call.id)}
                    className="w-full text-left px-4 py-3.5 flex items-start justify-between gap-3 transition-colors"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-soft)' : 'transparent',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border"
                        style={{
                          backgroundColor: 'var(--bg-surface-subtle)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        {renderDirectionIcon(call.direction)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {call.contactName}
                        </div>
                        <div className="text-[11px] font-mono-code mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {call.phoneNumber} · {call.direction} · {formatCallSeconds(call.durationSeconds)}
                        </div>
                        <div className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                          {call.notes}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <StatusBadge
                        label={call.outcome}
                        tone={call.direction === 'Missed' ? 'danger' : 'neutral'}
                      />
                      <div className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {formatDateTime(call.timestamp)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedCall && (
            <div
              className="p-4 rounded-xl border space-y-2"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Call details · {selectedCall.contactName}
                </h3>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Handled by {selectedCall.agentName}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {selectedCall.notes}
              </p>
            </div>
          )}
        </div>

        {/* Simulated Dialer */}
        <div
          className="p-5 rounded-xl border space-y-4 h-fit"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Simulated dialer
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Demo call logger (no live audio or recording)
              </p>
            </div>
            <PhoneCall className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden="true" />
          </div>

          <form onSubmit={handleSimulatedCall} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Phone number *
              </label>
              <input
                type="text"
                value={dialPhone}
                onChange={(e) => setDialPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border font-mono-code"
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderColor: dialError ? 'var(--danger-fg)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              {dialError && <p className="text-[11px] mt-1" style={{ color: 'var(--danger-fg)' }}>{dialError}</p>}
            </div>

            <div className="grid grid-cols-3 gap-1.5" aria-label="Dialpad digits">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '0', '⌫'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === '⌫') {
                      setDialPhone((p) => p.slice(0, -1));
                    } else {
                      setDialPhone((p) => `${p}${key}`);
                    }
                  }}
                  className="py-2 text-xs font-semibold rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {key}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Contact name
              </label>
              <input
                type="text"
                value={dialName}
                onChange={(e) => setDialName(e.target.value)}
                placeholder="Client or caller name"
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Outcome
              </label>
              <select
                value={dialOutcome}
                onChange={(e) => setDialOutcome(e.target.value as CallOutcome)}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Call notes
              </label>
              <textarea
                rows={2}
                value={dialNotes}
                onChange={(e) => setDialNotes(e.target.value)}
                placeholder="Summary of conversation..."
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-medium rounded-lg transition-opacity hover:opacity-90"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-fg)',
              }}
            >
              Place simulated call &amp; log
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
