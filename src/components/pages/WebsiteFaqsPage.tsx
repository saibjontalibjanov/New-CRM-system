import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  HelpCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useCrm } from '../../store/CrmContext';
import type { FaqItem } from '../../types/crm';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';

const FAQ_CATEGORIES: FaqItem['category'][] = [
  'Bookings',
  'Visas & Entry',
  'Payments',
  'Changes & Refunds',
];

export function WebsiteFaqsPage() {
  const { state, upsertFaq, deleteFaq, moveFaqOrder } = useCrm();

  const [search, setSearch] = useState('');
  const [openPreviewId, setOpenPreviewId] = useState<string | null>(
    state.faqs.find((f) => f.published)?.id ?? null
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState<FaqItem['category']>('Bookings');
  const [published, setPublished] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null);

  const orderedFaqs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...state.faqs]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .filter((f) => {
        if (!q) return true;
        return (
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
        );
      });
  }, [state.faqs, search]);

  const publishedFaqs = useMemo(
    () =>
      [...state.faqs]
        .filter((f) => f.published)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [state.faqs]
  );

  const openNew = () => {
    setEditing(null);
    setQuestion('');
    setAnswer('');
    setCategory('Bookings');
    setPublished(true);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (f: FaqItem) => {
    setEditing(f);
    setQuestion(f.question);
    setAnswer(f.answer);
    setCategory(f.category);
    setPublished(f.published);
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setError('Both question and answer are required.');
      return;
    }
    upsertFaq({
      id: editing?.id,
      question: question.trim(),
      answer: answer.trim(),
      category,
      displayOrder: editing?.displayOrder ?? state.faqs.length + 1,
      published,
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Website FAQs
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Add, reorder, publish, and preview frequently asked traveler questions.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap self-start sm:self-auto"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          Add FAQ
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="search"
          aria-label="Search FAQs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions, answers, or categories..."
          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {orderedFaqs.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No FAQs match your search"
          description="Clear the search filter or add a new traveler FAQ item."
          actionLabel="Add FAQ"
          onAction={openNew}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Editor List */}
          <div className="lg:col-span-3 space-y-3">
            {orderedFaqs.map((faq, idx) => (
              <div
                key={faq.id}
                className="p-4 rounded-xl border space-y-2.5"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                      #{faq.displayOrder} · {faq.category}
                    </div>
                    <h3 className="text-sm font-semibold mt-0.5">{faq.question}</h3>
                  </div>
                  <StatusBadge
                    label={faq.published ? 'Published' : 'Draft'}
                    tone={faq.published ? 'success' : 'neutral'}
                  />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {faq.answer}
                </p>
                <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0 || Boolean(search)}
                      onClick={() => moveFaqOrder(faq.id, 'up')}
                      aria-label={`Move FAQ ${faq.displayOrder} up`}
                      className="p-1.5 rounded-md border disabled:opacity-35"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === orderedFaqs.length - 1 || Boolean(search)}
                      onClick={() => moveFaqOrder(faq.id, 'down')}
                      aria-label={`Move FAQ ${faq.displayOrder} down`}
                      className="p-1.5 rounded-md border disabled:opacity-35"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => upsertFaq({ ...faq, published: !faq.published })}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-md border"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      {faq.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(faq)}
                      aria-label={`Edit FAQ: ${faq.question}`}
                      className="p-1.5 rounded-md border"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(faq)}
                      aria-label={`Delete FAQ: ${faq.question}`}
                      className="p-1.5 rounded-md border"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--danger-fg)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Accordion Preview */}
          <div
            className="lg:col-span-2 p-5 rounded-xl border space-y-3 h-fit"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Accordion preview ({publishedFaqs.length} published)
            </h3>
            <div className="space-y-2">
              {publishedFaqs.map((faq) => {
                const isOpen = openPreviewId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="rounded-lg border overflow-hidden"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenPreviewId(isOpen ? null : faq.id)}
                      className="w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 text-xs font-semibold"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div
                        className="px-3.5 pb-3 pt-1 text-xs leading-relaxed border-t"
                        style={{
                          color: 'var(--text-secondary)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit FAQ item' : 'Add FAQ item'}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && <p className="text-xs" style={{ color: 'var(--danger-fg)' }}>{error}</p>}
          <div>
            <label className="block text-xs font-medium mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FaqItem['category'])}
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              {FAQ_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Question *</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Answer *</label>
            <textarea
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
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
              {editing ? 'Save FAQ' : 'Add FAQ'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteFaq(deleteTarget.id);
        }}
        title="Delete FAQ item?"
        description={`Remove "${deleteTarget?.question}" from Website FAQs?`}
        confirmLabel="Delete FAQ"
      />
    </div>
  );
}
