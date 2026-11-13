import React, { useEffect, useMemo, useState } from 'react';
import {
  Kanban,
  List,
  MessageSquarePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { formatMoneyFromUsd } from '../../lib/currency';
import { formatDateTime, formatShortDate } from '../../lib/date';
import { isValidEmail } from '../../lib/validation';
import { useCrm } from '../../store/CrmContext';
import type { Lead, LeadSource, LeadStage } from '../../types/crm';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import { getLeadStageTone, StatusBadge } from '../ui/StatusBadge';

const STAGES: LeadStage[] = ['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'];
const SOURCES: LeadSource[] = [
  'Website Form',
  'Telegram',
  'Phone Call',
  'Referral',
  'Corporate',
  'Instagram',
];

interface LeadFormState {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  originCode: string;
  destinationCode: string;
  destination: string;
  travelDate: string;
  budgetUsd: string;
  source: LeadSource;
  stage: LeadStage;
  assignedAgent: string;
}

const EMPTY_FORM: LeadFormState = {
  fullName: '',
  email: '',
  phone: '',
  company: '',
  originCode: 'TAS',
  destinationCode: 'IST',
  destination: 'Istanbul, Turkey',
  travelDate: '2026-12-05',
  budgetUsd: '1800',
  source: 'Website Form',
  stage: 'New',
  assignedAgent: 'Dilshod Karimov',
};

export function LeadsPage() {
  const {
    state,
    createLead,
    updateLead,
    changeLeadStage,
    addLeadNote,
    deleteLead,
    pendingLeadModalOpen,
    setPendingLeadModalOpen,
  } = useCrm();

  const currency = state.profile.preferredCurrency;
  const agents = state.teamMembers.map((m) => m.fullName);

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'updated' | 'budget' | 'travelDate'>('updated');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);

  useEffect(() => {
    if (pendingLeadModalOpen) {
      setEditingLead(null);
      setForm({ ...EMPTY_FORM, assignedAgent: state.profile.fullName });
      setErrors({});
      setModalOpen(true);
      setPendingLeadModalOpen(false);
    }
  }, [pendingLeadModalOpen, setPendingLeadModalOpen, state.profile.fullName]);

  const selectedLead = useMemo(
    () => state.leads.find((l) => l.id === selectedLeadId) ?? null,
    [state.leads, selectedLeadId]
  );

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...state.leads]
      .filter((l) => {
        if (stageFilter !== 'All' && l.stage !== stageFilter) return false;
        if (sourceFilter !== 'All' && l.source !== sourceFilter) return false;
        if (!q) return true;
        return (
          l.fullName.toLowerCase().includes(q) ||
          l.destination.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          `${l.originCode} ${l.destinationCode}`.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'budget') return b.budgetUsd - a.budgetUsd;
        if (sortBy === 'travelDate') return a.travelDate.localeCompare(b.travelDate);
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [state.leads, search, stageFilter, sourceFilter, sortBy]);

  const openCreateModal = () => {
    setEditingLead(null);
    setForm({ ...EMPTY_FORM, assignedAgent: state.profile.fullName });
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setForm({
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company ?? '',
      originCode: lead.originCode,
      destinationCode: lead.destinationCode,
      destination: lead.destination,
      travelDate: lead.travelDate,
      budgetUsd: String(lead.budgetUsd),
      source: lead.source,
      stage: lead.stage,
      assignedAgent: lead.assignedAgent,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required.';
    if (!form.email.trim() || !isValidEmail(form.email)) nextErrors.email = 'Valid email is required.';
    if (!form.phone.trim()) nextErrors.phone = 'Phone number is required.';
    if (!form.destination.trim()) nextErrors.destination = 'Destination is required.';
    const budget = Number(form.budgetUsd);
    if (!Number.isFinite(budget) || budget <= 0) nextErrors.budgetUsd = 'Budget must be positive.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      company: form.company.trim() || undefined,
      originCode: form.originCode.trim().toUpperCase() || 'TAS',
      destinationCode: form.destinationCode.trim().toUpperCase() || 'IST',
      destination: form.destination.trim(),
      travelDate: form.travelDate,
      budgetUsd: Math.round(budget),
      source: form.source,
      stage: form.stage,
      assignedAgent: form.assignedAgent,
    };

    if (editingLead) {
      updateLead(editingLead.id, payload);
    } else {
      createLead(payload);
    }
    setModalOpen(false);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !noteInput.trim()) return;
    addLeadNote(selectedLead.id, noteInput);
    setNoteInput('');
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Leads &amp; CRM pipeline
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Manage client inquiries across 6 pipeline stages. All updates write to the activity log.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex items-center p-1 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
              style={{
                backgroundColor: viewMode === 'kanban' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--accent-fg)' : 'var(--text-secondary)',
              }}
            >
              <Kanban className="w-3.5 h-3.5" aria-hidden="true" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
              style={{
                backgroundColor: viewMode === 'table' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'table' ? 'var(--accent-fg)' : 'var(--text-secondary)',
              }}
            >
              <List className="w-3.5 h-3.5" aria-hidden="true" />
              Table
            </button>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-fg)',
            }}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Add lead
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="p-3.5 rounded-xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="relative">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="search"
            aria-label="Search leads"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client, route, email..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <select
          aria-label="Filter by stage"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="All">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by lead source"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border"
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

        <select
          aria-label="Sort leads"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'updated' | 'budget' | 'travelDate')}
          className="px-3 py-2 text-xs rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="updated">Sort: Recently updated</option>
          <option value="budget">Sort: Highest budget</option>
          <option value="travelDate">Sort: Earliest travel date</option>
        </select>
      </div>

      {filteredLeads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads match your filters"
          description="Adjust your search criteria or add a new customer inquiry to the pipeline."
          actionLabel="Add lead"
          onAction={openCreateModal}
        />
      ) : viewMode === 'kanban' ? (
        /* Kanban Pipeline */
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-6 gap-3 min-w-[1080px]">
            {STAGES.map((stage) => {
              const items = filteredLeads.filter((l) => l.stage === stage);
              const stageBudget = items.reduce((s, l) => s + l.budgetUsd, 0);

              return (
                <div
                  key={stage}
                  className="rounded-xl border flex flex-col min-h-[380px]"
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div
                    className="px-3 py-2.5 border-b flex items-center justify-between gap-2"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {stage}
                      </span>
                      <span
                        className="text-[11px] font-medium px-1.5 py-0.5 rounded tabular-nums"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {items.length}
                      </span>
                    </div>
                    <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {formatMoneyFromUsd(stageBudget, currency, true)}
                    </span>
                  </div>

                  <div className="p-2 space-y-2 flex-1">
                    {items.map((lead) => (
                      <div
                        key={lead.id}
                        className="p-3 rounded-lg border space-y-2 transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLeadId(lead.id)}
                            className="text-left text-xs font-semibold hover:underline truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {lead.fullName}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(lead)}
                            aria-label={`Edit ${lead.fullName}`}
                            className="p-1 rounded hover:opacity-75 shrink-0"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-mono-code font-medium" style={{ color: 'var(--accent)' }}>
                            {lead.originCode} → {lead.destinationCode}
                          </span>{' '}
                          · {lead.destination}
                        </div>

                        <div className="flex items-center justify-between text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          <span>{formatMoneyFromUsd(lead.budgetUsd, currency)}</span>
                          <span>{formatShortDate(lead.travelDate)}</span>
                        </div>

                        <div className="pt-1 border-t flex items-center justify-between gap-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
                          <select
                            aria-label={`Change stage for ${lead.fullName}`}
                            value={lead.stage}
                            onChange={(e) => changeLeadStage(lead.id, e.target.value as LeadStage)}
                            className="text-[11px] px-1.5 py-1 rounded border flex-1 min-w-0"
                            style={{
                              backgroundColor: 'var(--bg-surface-subtle)',
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {STAGES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setSelectedLeadId(lead.id)}
                            aria-label={`View details for ${lead.fullName}`}
                            className="text-[11px] font-medium px-2 py-1 rounded border shrink-0"
                            style={{
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--accent)',
                            }}
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Table View */
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
                  <th className="py-3 px-4 font-medium">Client</th>
                  <th className="py-3 px-4 font-medium">Route &amp; Destination</th>
                  <th className="py-3 px-4 font-medium">Travel Date</th>
                  <th className="py-3 px-4 font-medium">Stage</th>
                  <th className="py-3 px-4 font-medium">Source</th>
                  <th className="py-3 px-4 font-medium">Agent</th>
                  <th className="py-3 px-4 font-medium text-right">Budget</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setSelectedLeadId(lead.id)}
                        className="font-semibold hover:underline text-left"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {lead.fullName}
                      </button>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {lead.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono-code font-medium" style={{ color: 'var(--accent)' }}>
                        {lead.originCode} → {lead.destinationCode}
                      </span>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {lead.destination}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {formatShortDate(lead.travelDate)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge label={lead.stage} tone={getLeadStageTone(lead.stage)} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {lead.source}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {lead.assignedAgent}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold tabular-nums whitespace-nowrap">
                      {formatMoneyFromUsd(lead.budgetUsd, currency)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(lead)}
                          aria-label={`Edit ${lead.fullName}`}
                          className="p-1.5 rounded-md border"
                          style={{
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(lead)}
                          aria-label={`Delete ${lead.fullName}`}
                          className="p-1.5 rounded-md border"
                          style={{
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--danger-fg)',
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Lead Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingLead ? `Edit lead: ${editingLead.fullName}` : 'Add new lead'}
        subtitle="Customer inquiry stored in local demo CRM"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Full name *
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: errors.fullName ? 'var(--danger-fg)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.fullName && <p className="text-xs mt-1" style={{ color: 'var(--danger-fg)' }}>{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Company (optional)
              </label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: errors.email ? 'var(--danger-fg)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--danger-fg)' }}>{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Phone *
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+998 90 ..."
                className="w-full px-3 py-2 text-sm rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: errors.phone ? 'var(--danger-fg)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.phone && <p className="text-xs mt-1" style={{ color: 'var(--danger-fg)' }}>{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Origin IATA
              </label>
              <input
                type="text"
                maxLength={3}
                value={form.originCode}
                onChange={(e) => setForm((f) => ({ ...f, originCode: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 text-sm rounded-lg border font-mono-code"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Destination IATA
              </label>
              <input
                type="text"
                maxLength={3}
                value={form.destinationCode}
                onChange={(e) => setForm((f) => ({ ...f, destinationCode: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 text-sm rounded-lg border font-mono-code"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Destination city &amp; country *
              </label>
              <input
                type="text"
                value={form.destination}
                onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: errors.destination ? 'var(--danger-fg)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.destination && <p className="text-xs mt-1" style={{ color: 'var(--danger-fg)' }}>{errors.destination}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Target travel date
              </label>
              <input
                type="date"
                value={form.travelDate}
                onChange={(e) => setForm((f) => ({ ...f, travelDate: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Estimated budget (USD) *
              </label>
              <input
                type="number"
                min={1}
                value={form.budgetUsd}
                onChange={(e) => setForm((f) => ({ ...f, budgetUsd: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border tabular-nums"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: errors.budgetUsd ? 'var(--danger-fg)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.budgetUsd && <p className="text-xs mt-1" style={{ color: 'var(--danger-fg)' }}>{errors.budgetUsd}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Source
              </label>
              <select
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as LeadSource }))}
                className="w-full px-3 py-2 text-sm rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Pipeline stage
              </label>
              <select
                value={form.stage}
                onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value as LeadStage }))}
                className="w-full px-3 py-2 text-sm rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Assigned agent
              </label>
              <select
                value={form.assignedAgent}
                onChange={(e) => setForm((f) => ({ ...f, assignedAgent: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {agents.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-fg)',
              }}
            >
              {editingLead ? 'Save changes' : 'Create lead'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Lead Details Drawer */}
      <Drawer
        open={Boolean(selectedLead)}
        onClose={() => setSelectedLeadId(null)}
        title={selectedLead?.fullName ?? ''}
        subtitle={
          selectedLead
            ? `${selectedLead.originCode} → ${selectedLead.destinationCode} · ${selectedLead.destination}`
            : undefined
        }
      >
        {selectedLead && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2">
              <StatusBadge label={selectedLead.stage} tone={getLeadStageTone(selectedLead.stage)} />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedLead)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Edit lead
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(selectedLead)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border"
                  style={{
                    borderColor: 'var(--danger-border)',
                    color: 'var(--danger-fg)',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>

            <div
              className="p-4 rounded-xl border grid grid-cols-2 gap-3 text-xs"
              style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Email</div>
                <div className="font-medium mt-0.5 break-all">{selectedLead.email}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Phone</div>
                <div className="font-medium mt-0.5 tabular-nums">{selectedLead.phone}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Budget</div>
                <div className="font-semibold mt-0.5 tabular-nums">
                  {formatMoneyFromUsd(selectedLead.budgetUsd, currency)}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Travel date</div>
                <div className="font-medium mt-0.5 tabular-nums">
                  {formatShortDate(selectedLead.travelDate)}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Source</div>
                <div className="font-medium mt-0.5">{selectedLead.source}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Assigned agent</div>
                <div className="font-medium mt-0.5">{selectedLead.assignedAgent}</div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Move pipeline stage
              </label>
              <select
                value={selectedLead.stage}
                onChange={(e) => changeLeadStage(selectedLead.id, e.target.value as LeadStage)}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Note */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Add consultant note
              </label>
              <textarea
                rows={3}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Log call summary, quote preferences, or follow-up reminder..."
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="submit"
                disabled={!noteInput.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-fg)',
                }}
              >
                <MessageSquarePlus className="w-3.5 h-3.5" aria-hidden="true" />
                Save note
              </button>
            </form>

            {/* Notes Timeline */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Notes ({selectedLead.notes.length})
              </h4>
              {selectedLead.notes.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  No notes recorded yet.
                </p>
              ) : (
                selectedLead.notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-lg border text-xs"
                    style={{
                      backgroundColor: 'var(--bg-surface-subtle)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {n.author}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {formatDateTime(n.createdAt)}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }}>{n.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            if (selectedLeadId === deleteTarget.id) setSelectedLeadId(null);
            deleteLead(deleteTarget.id);
          }
        }}
        title="Delete lead record?"
        description={`This will permanently remove "${deleteTarget?.fullName}" and their notes from the local demo workspace.`}
        confirmLabel="Delete lead"
      />
    </div>
  );
}
