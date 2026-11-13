import { useMemo, useState } from 'react';
import { Activity, Search } from 'lucide-react';
import { formatDateTime } from '../../lib/date';
import { useCrm } from '../../store/CrmContext';
import type { ActivityEntityType } from '../../types/crm';
import { EmptyState } from '../ui/EmptyState';

const ENTITY_TYPES: ('All' | ActivityEntityType)[] = [
  'All',
  'Lead',
  'Booking',
  'Call',
  'Offer',
  'Partner',
  'Testimonial',
  'FAQ',
  'Telegram',
  'Subscriber',
  'Saved Search',
  'Team',
  'Account',
];

export function ActivityLogPage() {
  const { state } = useCrm();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<'All' | ActivityEntityType>('All');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.activityLog.filter((entry) => {
      if (entityFilter !== 'All' && entry.entityType !== entityFilter) return false;
      if (!q) return true;
      return (
        entry.actor.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q) ||
        entry.entityLabel.toLowerCase().includes(q) ||
        (entry.details ?? '').toLowerCase().includes(q)
      );
    });
  }, [state.activityLog, search, entityFilter]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Activity log
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Local audit trail recording creations, updates, deletions, and pipeline stage changes.
        </p>
      </div>

      <div
        className="p-3.5 rounded-xl border flex flex-col sm:flex-row gap-3"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="search"
            aria-label="Search activity log"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actor, action, or record..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <select
          aria-label="Filter by entity type"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value as 'All' | ActivityEntityType)}
          className="px-3 py-2 text-xs rounded-lg border sm:w-52"
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'All' ? 'All record types' : t}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No matching activity entries"
          description="Try clearing your search or perform an action in Leads, Bookings, or Website content."
        />
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <th className="py-3 px-4 font-medium">Timestamp</th>
                  <th className="py-3 px-4 font-medium">Actor</th>
                  <th className="py-3 px-4 font-medium">Action</th>
                  <th className="py-3 px-4 font-medium">Entity</th>
                  <th className="py-3 px-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {filtered.map((entry) => (
                  <tr key={entry.id} style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="py-3 px-4 whitespace-nowrap tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {formatDateTime(entry.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-medium whitespace-nowrap">{entry.actor}</td>
                    <td className="py-3 px-4 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {entry.action}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className="font-mono-code text-[11px] px-1.5 py-0.5 rounded mr-1.5"
                        style={{
                          backgroundColor: 'var(--bg-surface-subtle)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {entry.entityType}
                      </span>
                      <span className="font-medium" style={{ color: 'var(--accent)' }}>
                        {entry.entityLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>
                      {entry.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
