import React, { useState } from 'react';
import { Award, ExternalLink, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCrm } from '../../store/CrmContext';
import type { PartnerLogo } from '../../types/crm';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';

const CATEGORIES: PartnerLogo['category'][] = [
  'Airline',
  'Hotel Group',
  'Insurance',
  'DMC',
  'Payment',
];

export function PartnerLogosPage() {
  const { state, upsertPartner, deletePartner } = useCrm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerLogo | null>(null);
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [category, setCategory] = useState<PartnerLogo['category']>('Airline');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [published, setPublished] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PartnerLogo | null>(null);
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({});

  const openNew = () => {
    setEditing(null);
    setName('');
    setWebsiteUrl('https://');
    setLogoUrl('');
    setCategory('Airline');
    setDisplayOrder(String(state.partners.length + 1));
    setPublished(true);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (p: PartnerLogo) => {
    setEditing(p);
    setName(p.name);
    setWebsiteUrl(p.websiteUrl);
    setLogoUrl(p.logoUrl ?? '');
    setCategory(p.category);
    setDisplayOrder(String(p.displayOrder));
    setPublished(p.published);
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Partner name is required.');
      return;
    }
    const orderNum = Math.max(1, Number(displayOrder) || 1);
    upsertPartner({
      id: editing?.id,
      name: name.trim(),
      websiteUrl: websiteUrl.trim() || 'https://staraviatravel.demo',
      logoUrl: logoUrl.trim() || undefined,
      category,
      displayOrder: orderNum,
      published,
    });
    setModalOpen(false);
  };

  const ordered = [...state.partners].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Partner logos
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Manage airline, hospitality, and payment partners displayed on the StarAviaTravel website.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap self-start sm:self-auto"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          Add partner
        </button>
      </div>

      {ordered.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No partner logos added"
          description="Add airline or hospitality partners to showcase on the website."
          actionLabel="Add partner"
          onAction={openNew}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ordered.map((p) => {
            const showImg = Boolean(p.logoUrl) && !failedLogos[p.id];
            return (
              <div
                key={p.id}
                className="p-4 rounded-xl border flex flex-col justify-between gap-4"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="space-y-3">
                  {/* Logo Preview / Branded Text Fallback */}
                  <div
                    className="h-20 rounded-lg border flex items-center justify-center px-4"
                    style={{
                      backgroundColor: 'var(--bg-surface-subtle)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    {showImg ? (
                      <img
                        src={p.logoUrl}
                        alt={`${p.name} logo`}
                        referrerPolicy="no-referrer"
                        onError={() => setFailedLogos((prev) => ({ ...prev, [p.id]: true }))}
                        className="max-h-12 max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>
                          {p.name}
                        </div>
                        <div className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                          {p.category}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{p.name}</div>
                      <a
                        href={p.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] hover:underline truncate max-w-full"
                        style={{ color: 'var(--accent)' }}
                      >
                        <span className="truncate">{p.websiteUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                    <span className="font-mono-code text-xs px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)' }}>
                      #{p.displayOrder}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <StatusBadge
                    label={p.published ? 'Published' : 'Hidden'}
                    tone={p.published ? 'success' : 'neutral'}
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => upsertPartner({ ...p, published: !p.published })}
                      aria-label={p.published ? `Hide ${p.name}` : `Publish ${p.name}`}
                      className="p-1.5 rounded-md border"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    >
                      {p.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      aria-label={`Edit ${p.name}`}
                      className="p-1.5 rounded-md border"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(p)}
                      aria-label={`Delete ${p.name}`}
                      className="p-1.5 rounded-md border"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--danger-fg)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit partner: ${editing.name}` : 'Add partner logo'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-xs" style={{ color: 'var(--danger-fg)' }}>{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Partner name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PartnerLogo['category'])}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Display order</label>
              <input
                type="number"
                min={1}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border tabular-nums"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Website URL</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Logo image URL (optional — uses branded fallback if blank)</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
                <span>Published on website</span>
              </label>
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
              {editing ? 'Save partner' : 'Add partner'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deletePartner(deleteTarget.id);
        }}
        title="Delete partner logo?"
        description={`Remove "${deleteTarget?.name}" from the partner showcase?`}
        confirmLabel="Delete partner"
      />
    </div>
  );
}
