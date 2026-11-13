import React, { useState } from 'react';
import { MessageSquare, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { formatShortDate } from '../../lib/date';
import { useCrm } from '../../store/CrmContext';
import type { Testimonial } from '../../types/crm';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';

export function TestimonialsPage() {
  const { state, upsertTestimonial, deleteTestimonial } = useCrm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [routeOrTrip, setRouteOrTrip] = useState('');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [reviewText, setReviewText] = useState('');
  const [published, setPublished] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);

  const openNew = () => {
    setEditing(null);
    setCustomerName('');
    setRouteOrTrip('');
    setRating(5);
    setReviewText('');
    setPublished(true);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setCustomerName(t.customerName);
    setRouteOrTrip(t.routeOrTrip);
    setRating(t.rating);
    setReviewText(t.reviewText);
    setPublished(t.published);
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !reviewText.trim()) {
      setError('Customer name and review text are required.');
      return;
    }
    upsertTestimonial({
      id: editing?.id,
      customerName: customerName.trim(),
      routeOrTrip: routeOrTrip.trim() || 'International itinerary',
      rating,
      reviewText: reviewText.trim(),
      published,
    });
    setModalOpen(false);
  };

  const publishedReviews = state.testimonials.filter((t) => t.published);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Testimonials
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Curate verified client reviews and preview how published cards appear on the public site.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap self-start sm:self-auto"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          Add review
        </button>
      </div>

      {state.testimonials.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No testimonials yet"
          description="Add customer feedback to publish on the StarAviaTravel homepage."
          actionLabel="Add review"
          onAction={openNew}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Management List */}
          <div className="lg:col-span-2 space-y-3">
            {state.testimonials.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border space-y-2.5"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{item.customerName}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {item.routeOrTrip} · {formatShortDate(item.createdAt)}
                    </div>
                  </div>
                  <StatusBadge
                    label={item.published ? 'Published' : 'Draft'}
                    tone={item.published ? 'success' : 'neutral'}
                  />
                </div>

                <div className="flex items-center gap-0.5" aria-label={`Rated ${item.rating} out of 5`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-3.5 h-3.5"
                      fill={star <= item.rating ? 'var(--gold-detail)' : 'none'}
                      style={{ color: star <= item.rating ? 'var(--gold-detail)' : 'var(--border-strong)' }}
                    />
                  ))}
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  &ldquo;{item.reviewText}&rdquo;
                </p>

                <div className="pt-2 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => upsertTestimonial({ ...item, published: !item.published })}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-md border"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    {item.published ? 'Move to draft' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    aria-label={`Edit review by ${item.customerName}`}
                    className="p-1.5 rounded-md border"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    aria-label={`Delete review by ${item.customerName}`}
                    className="p-1.5 rounded-md border"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--danger-fg)' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Public Preview */}
          <div
            className="p-5 rounded-xl border space-y-3 h-fit"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Website preview ({publishedReviews.length} live)
            </h3>
            {publishedReviews.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Publish at least one review to preview the website section.
              </p>
            ) : (
              <div className="space-y-3">
                {publishedReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-lg border space-y-2"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="w-3 h-3"
                          fill={s <= rev.rating ? 'var(--gold-detail)' : 'none'}
                          style={{ color: s <= rev.rating ? 'var(--gold-detail)' : 'var(--border-strong)' }}
                        />
                      ))}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      &ldquo;{rev.reviewText}&rdquo;
                    </p>
                    <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                      — {rev.customerName}, {rev.routeOrTrip}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit testimonial: ${editing.customerName}` : 'Add testimonial'}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && <p className="text-xs" style={{ color: 'var(--danger-fg)' }}>{error}</p>}
          <div>
            <label className="block text-xs font-medium mb-1">Customer name *</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Route or trip</label>
              <input
                type="text"
                value={routeOrTrip}
                onChange={(e) => setRouteOrTrip(e.target.value)}
                placeholder="Tashkent → Milan"
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Rating</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Review text *</label>
            <textarea
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            <span>Published on website</span>
          </label>
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
              {editing ? 'Save review' : 'Add review'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteTestimonial(deleteTarget.id);
        }}
        title="Delete testimonial?"
        description={`Remove the review by "${deleteTarget?.customerName}"?`}
        confirmLabel="Delete review"
      />
    </div>
  );
}
