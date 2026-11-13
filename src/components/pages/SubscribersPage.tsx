import React, { useMemo, useState } from 'react';
import { Download, Mail, Plus, Search, Trash2 } from 'lucide-react';
import { buildCsvContent } from '../../lib/csv';
import { formatShortDate } from '../../lib/date';
import { validateSubscriberInput } from '../../lib/validation';
import { useCrm } from '../../store/CrmContext';
import type { Subscriber, SubscriberSource } from '../../types/crm';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';

const SOURCES: SubscriberSource[] = [
  'Website Footer',
  'Offer Landing Page',
  'Telegram Bot',
  'Booking Opt-In',
];

export function SubscribersPage() {
  const { state, addSubscriber, deleteSubscriber, pushToast } = useCrm();

  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [source, setSource] = useState<SubscriberSource>('Website Footer');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Subscriber | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.subscribers.filter((s) => {
      if (sourceFilter !== 'All' && s.source !== sourceFilter) return false;
      if (!q) return true;
      return (
        s.email.toLowerCase().includes(q) ||
        (s.name ?? '').toLowerCase().includes(q) ||
        s.source.toLowerCase().includes(q)
      );
    });
  }, [state.subscribers, search, sourceFilter]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateSubscriberInput(email, state.subscribers);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    addSubscriber({
      email,
      name: name.trim() || undefined,
      source,
    });
    setEmail('');
    setName('');
    setErrors({});
    setModalOpen(false);
  };

  const handleExportCsv = () => {
    const csv = buildCsvContent(
      ['Email', 'Name', 'Source', 'Subscribed Date'],
      filtered.map((s) => [s.email, s.name ?? '', s.source, s.subscribedAt])
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `staravia-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    pushToast(`Exported ${filtered.length} subscriber(s) to safe CSV.`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Subscribers
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Newsletter subscribers with duplicate-email validation and formula-safe CSV export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border disabled:opacity-50 whitespace-nowrap"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => {
              setErrors({});
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Add subscriber
          </button>
        </div>
      </div>

      {/* Filters */}
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
            aria-label="Search subscribers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <select
          aria-label="Filter by source"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border sm:w-52"
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="All">All sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No subscribers match your search"
          description="Clear filters or add a new newsletter subscriber."
          actionLabel="Add subscriber"
          onAction={() => setModalOpen(true)}
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
                  <th className="py-3 px-4 font-medium">Email</th>
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Source</th>
                  <th className="py-3 px-4 font-medium">Subscribed Date</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {filtered.map((s) => (
                  <tr key={s.id} style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="py-3 px-4 font-medium whitespace-nowrap">{s.email}</td>
                    <td className="py-3 px-4 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {s.name || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {s.source}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {formatShortDate(s.subscribedAt)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(s)}
                        aria-label={`Delete subscriber ${s.email}`}
                        className="p-1.5 rounded-md border"
                        style={{ borderColor: 'var(--border-subtle)', color: 'var(--danger-fg)' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add subscriber">
        <form onSubmit={handleAdd} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium mb-1">Email address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({});
              }}
              placeholder="traveler@example.com"
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: errors.email ? 'var(--danger-fg)' : 'var(--border-subtle)',
              }}
            />
            {errors.email && <p className="text-[11px] mt-1" style={{ color: 'var(--danger-fg)' }}>{errors.email}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as SubscriberSource)}
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              {SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
            >
              Add subscriber
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteSubscriber(deleteTarget.id);
        }}
        title="Remove subscriber?"
        description={`Remove "${deleteTarget?.email}" from the subscriber list?`}
        confirmLabel="Remove"
      />
    </div>
  );
}
