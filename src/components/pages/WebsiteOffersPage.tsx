import React, { useState } from 'react';
import { Pencil, Plane, Plus, Tag, Trash2 } from 'lucide-react';
import { formatNativeCurrency } from '../../lib/currency';
import { formatShortDate } from '../../lib/date';
import { useCrm } from '../../store/CrmContext';
import type { CurrencyCode, WebsiteOffer } from '../../types/crm';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';

export function WebsiteOffersPage() {
  const { state, upsertOffer, deleteOffer } = useCrm();

  const [filterStatus, setFilterStatus] = useState<'All' | 'Published' | 'Draft'>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WebsiteOffer | null>(null);

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [routeSummary, setRouteSummary] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('750');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [imageUrl, setImageUrl] = useState('');
  const [validUntil, setValidUntil] = useState('2026-12-31');
  const [status, setStatus] = useState<'Draft' | 'Published'>('Draft');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<WebsiteOffer | null>(null);
  const [brokenImg, setBrokenImg] = useState<Record<string, boolean>>({});

  const filtered = state.offers.filter(
    (o) => filterStatus === 'All' || o.status === filterStatus
  );

  const openNew = () => {
    setEditing(null);
    setTitle('');
    setDestination('');
    setRouteSummary('TAS → IST · 5 Nights');
    setDescription('');
    setPrice('750');
    setCurrency('USD');
    setImageUrl('');
    setValidUntil('2026-12-31');
    setStatus('Draft');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (o: WebsiteOffer) => {
    setEditing(o);
    setTitle(o.title);
    setDestination(o.destination);
    setRouteSummary(o.routeSummary);
    setDescription(o.description);
    setPrice(String(o.price));
    setCurrency(o.currency);
    setImageUrl(o.imageUrl ?? '');
    setValidUntil(o.validUntil);
    setStatus(o.status);
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(price);
    if (!title.trim() || !destination.trim()) {
      setError('Offer title and destination are required.');
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError('Price must be greater than zero.');
      return;
    }
    upsertOffer({
      id: editing?.id,
      title: title.trim(),
      destination: destination.trim(),
      routeSummary: routeSummary.trim() || destination.trim(),
      description: description.trim(),
      price: Math.round(numericPrice),
      currency,
      imageUrl: imageUrl.trim() || undefined,
      validUntil,
      status,
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Website offers
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Create travel packages, toggle Draft vs Published visibility, and preview offer cards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div
            className="inline-flex items-center p-1 rounded-lg border"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            {(['All', 'Published', 'Draft'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className="px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                style={{
                  backgroundColor: filterStatus === s ? 'var(--accent)' : 'transparent',
                  color: filterStatus === s ? 'var(--accent-fg)' : 'var(--text-secondary)',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            New offer
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No travel offers in this view"
          description="Create a package offer to preview how it appears on the StarAviaTravel website."
          actionLabel="New offer"
          onAction={openNew}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((offer) => {
            const hasImage = Boolean(offer.imageUrl) && !brokenImg[offer.id];
            return (
              <article
                key={offer.id}
                className="rounded-xl border overflow-hidden flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  {/* Offer Card Preview Visual */}
                  <div
                    className="h-36 relative flex items-end p-4 border-b"
                    style={{
                      backgroundColor: 'var(--bg-surface-subtle)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    {hasImage ? (
                      <img
                        src={offer.imageUrl}
                        alt={offer.destination}
                        referrerPolicy="no-referrer"
                        onError={() => setBrokenImg((p) => ({ ...p, [offer.id]: true }))}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <Plane className="w-16 h-16" style={{ color: 'var(--accent)' }} />
                      </div>
                    )}
                    <div
                      className="relative z-10 flex items-center justify-between w-full gap-2 px-3 py-1.5 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <span className="text-xs font-semibold truncate">{offer.destination}</span>
                      <span className="font-mono-code text-[11px] shrink-0" style={{ color: 'var(--accent)' }}>
                        {offer.routeSummary}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-snug">{offer.title}</h3>
                      <StatusBadge
                        label={offer.status}
                        tone={offer.status === 'Published' ? 'success' : 'warning'}
                      />
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                      {offer.description}
                    </p>
                  </div>
                </div>

                <div
                  className="px-4 py-3 border-t flex items-center justify-between gap-2"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div>
                    <div className="text-sm font-bold tabular-nums">
                      From {formatNativeCurrency(offer.price, offer.currency)}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Valid until {formatShortDate(offer.validUntil)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        upsertOffer({
                          ...offer,
                          status: offer.status === 'Published' ? 'Draft' : 'Published',
                        })
                      }
                      className="px-2.5 py-1 text-[11px] font-medium rounded-md border"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      {offer.status === 'Published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(offer)}
                      aria-label={`Edit ${offer.title}`}
                      className="p-1.5 rounded-md border"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(offer)}
                      aria-label={`Delete ${offer.title}`}
                      className="p-1.5 rounded-md border"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--danger-fg)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit offer: ${editing.title}` : 'Create website offer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-xs" style={{ color: 'var(--danger-fg)' }}>{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Offer title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Destination *</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Istanbul, Turkey"
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Route summary</label>
              <input
                type="text"
                value={routeSummary}
                onChange={(e) => setRouteSummary(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border font-mono-code"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Starting price *</label>
              <input
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border tabular-nums"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="UZS">UZS</option>
                <option value="AED">AED</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Valid until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Publication status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Draft' | 'Published')}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Optional image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              />
            </div>
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
              {editing ? 'Save offer' : 'Create offer'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteOffer(deleteTarget.id);
        }}
        title="Delete website offer?"
        description={`Remove "${deleteTarget?.title}" from website offers?`}
        confirmLabel="Delete offer"
      />
    </div>
  );
}
