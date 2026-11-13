import { useState } from 'react';
import { Bookmark, Play, Plus, Trash2 } from 'lucide-react';
import { formatDateTime, formatShortDate } from '../../lib/date';
import { useCrm } from '../../store/CrmContext';
import type { SavedSearch } from '../../types/crm';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';

export function SavedSearchesPage() {
  const { state, navigate, setPendingSearchParams, deleteSavedSearch } = useCrm();
  const [deleteTarget, setDeleteTarget] = useState<SavedSearch | null>(null);

  const handleRerun = (item: SavedSearch) => {
    setPendingSearchParams(item.params);
    navigate('ticket-search');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Saved searches
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Re-run saved flight search parameters in Ticket search or remove outdated presets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('ticket-search')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap self-start sm:self-auto"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-fg)',
          }}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          New flight search
        </button>
      </div>

      {state.savedSearches.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved searches yet"
          description="Save a route from Ticket search to quickly rerun recurring client inquiries."
          actionLabel="Go to Ticket search"
          onAction={() => navigate('ticket-search')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {state.savedSearches.map((item) => {
            const p = item.params;
            const paxCount = p.adults + p.children + p.infants;
            return (
              <div
                key={item.id}
                className="p-5 rounded-xl border flex flex-col justify-between gap-4"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {item.label}
                    </h3>
                    <span
                      className="font-mono-code text-xs font-semibold px-2 py-0.5 rounded shrink-0"
                      style={{
                        backgroundColor: 'var(--accent-soft)',
                        color: 'var(--accent)',
                      }}
                    >
                      {p.originCode} → {p.destinationCode}
                    </span>
                  </div>

                  <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                    <div>
                      Trip: <span className="font-medium capitalize">{p.tripType}</span> · Cabin:{' '}
                      <span className="font-medium">{p.cabin}</span>
                    </div>
                    <div className="tabular-nums">
                      Departure: {formatShortDate(p.departureDate)}
                      {p.tripType === 'round-trip' && p.returnDate
                        ? ` · Return: ${formatShortDate(p.returnDate)}`
                        : ''}
                    </div>
                    <div className="tabular-nums">
                      Passengers: {paxCount} ({p.adults}A / {p.children}C / {p.infants}I)
                    </div>
                  </div>

                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Saved by {item.createdBy} · {formatDateTime(item.createdAt)}
                  </div>
                </div>

                <div
                  className="pt-3 border-t flex items-center justify-between gap-2"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <button
                    type="button"
                    onClick={() => handleRerun(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-fg)',
                    }}
                  >
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    Rerun search
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    aria-label={`Delete saved search ${item.label}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--danger-fg)',
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteSavedSearch(deleteTarget.id);
        }}
        title="Delete saved search?"
        description={`Remove "${deleteTarget?.label}" from your saved flight searches?`}
        confirmLabel="Delete search"
      />
    </div>
  );
}
