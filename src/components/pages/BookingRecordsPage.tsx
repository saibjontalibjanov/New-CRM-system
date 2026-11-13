import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Eye,
  Pencil,
  Plane,
  Plus,
  Search,
  Ticket,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { findAirportByCode } from '../../data/airports';
import { formatMoneyFromUsd } from '../../lib/currency';
import { formatShortDate } from '../../lib/date';
import { derivePaymentStatusFromAmounts, validateBookingInput } from '../../lib/validation';
import { useCrm } from '../../store/CrmContext';
import type {
  Booking,
  BookingStatus,
  CabinClass,
  Passenger,
  PaymentStatus,
} from '../../types/crm';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import {
  getBookingStatusTone,
  getPaymentStatusTone,
  StatusBadge,
} from '../ui/StatusBadge';

const BOOKING_STATUSES: BookingStatus[] = [
  'Draft',
  'Confirmed',
  'Pending Ticket',
  'Ticketed',
  'Cancelled',
];
const PAYMENT_STATUSES: PaymentStatus[] = ['Unpaid', 'Partially Paid', 'Paid', 'Refunded'];
const CABINS: CabinClass[] = ['Economy', 'Premium Economy', 'Business', 'First'];

interface BookingFormState {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  originCode: string;
  destinationCode: string;
  airline: string;
  flightNumber: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  returnDate: string;
  cabin: CabinClass;
  assignedAgent: string;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmountUsd: string;
  paidAmountUsd: string;
  notes: string;
  passengers: Passenger[];
}

function makeDefaultBookingForm(agent: string): BookingFormState {
  return {
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    originCode: 'TAS',
    destinationCode: 'IST',
    airline: 'Turkish Airlines',
    flightNumber: 'TK 369',
    departureDate: '2026-12-01',
    departureTime: '08:50',
    arrivalTime: '12:25',
    returnDate: '',
    cabin: 'Economy',
    assignedAgent: agent,
    bookingStatus: 'Draft',
    paymentStatus: 'Unpaid',
    totalAmountUsd: '850',
    paidAmountUsd: '0',
    notes: '',
    passengers: [{ id: 'p-init', fullName: '', type: 'Adult', nationality: 'UZ' }],
  };
}

export function BookingRecordsPage() {
  const {
    state,
    createBooking,
    updateBooking,
    deleteBooking,
    pendingBookingModalOpen,
    setPendingBookingModalOpen,
    pendingDraftFlight,
    setPendingDraftFlight,
  } = useCrm();

  const currency = state.profile.preferredCurrency;
  const agents = state.teamMembers.map((m) => m.fullName);

  const [search, setSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [form, setForm] = useState<BookingFormState>(() =>
    makeDefaultBookingForm(state.profile.fullName)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [drawerBookingId, setDrawerBookingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);

  useEffect(() => {
    if (pendingDraftFlight) {
      setEditingBooking(null);
      setForm({
        ...makeDefaultBookingForm(state.profile.fullName),
        originCode: pendingDraftFlight.originCode,
        destinationCode: pendingDraftFlight.destinationCode,
        airline: pendingDraftFlight.airline,
        flightNumber: pendingDraftFlight.flightNumber,
        departureDate: pendingDraftFlight.departureDate,
        departureTime: pendingDraftFlight.departureTime,
        arrivalTime: pendingDraftFlight.arrivalTime,
        cabin: pendingDraftFlight.cabin,
        bookingStatus: 'Draft',
        paymentStatus: 'Unpaid',
        totalAmountUsd: String(pendingDraftFlight.totalPriceUsd),
        paidAmountUsd: '0',
        notes: `Draft created from demo search result (${pendingDraftFlight.airline} ${pendingDraftFlight.flightNumber}). Ticket not issued.`,
      });
      setErrors({});
      setModalOpen(true);
      setPendingDraftFlight(null);
    } else if (pendingBookingModalOpen) {
      setEditingBooking(null);
      setForm(makeDefaultBookingForm(state.profile.fullName));
      setErrors({});
      setModalOpen(true);
      setPendingBookingModalOpen(false);
    }
  }, [
    pendingBookingModalOpen,
    pendingDraftFlight,
    setPendingBookingModalOpen,
    setPendingDraftFlight,
    state.profile.fullName,
  ]);

  const drawerBooking = useMemo(
    () => state.bookings.find((b) => b.id === drawerBookingId) ?? null,
    [state.bookings, drawerBookingId]
  );

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...state.bookings]
      .filter((b) => {
        if (bookingStatusFilter !== 'All' && b.bookingStatus !== bookingStatusFilter) return false;
        if (paymentStatusFilter !== 'All' && b.paymentStatus !== paymentStatusFilter) return false;
        if (dateFrom && b.departureDate < dateFrom) return false;
        if (dateTo && b.departureDate > dateTo) return false;
        if (!q) return true;
        return (
          b.reference.toLowerCase().includes(q) ||
          b.clientName.toLowerCase().includes(q) ||
          b.originCode.toLowerCase().includes(q) ||
          b.destinationCode.toLowerCase().includes(q) ||
          b.airline.toLowerCase().includes(q) ||
          b.flightNumber.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.bookings, search, bookingStatusFilter, paymentStatusFilter, dateFrom, dateTo]);

  const openCreateModal = () => {
    setEditingBooking(null);
    setForm(makeDefaultBookingForm(state.profile.fullName));
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (b: Booking) => {
    setEditingBooking(b);
    setForm({
      clientName: b.clientName,
      clientEmail: b.clientEmail,
      clientPhone: b.clientPhone,
      originCode: b.originCode,
      destinationCode: b.destinationCode,
      airline: b.airline,
      flightNumber: b.flightNumber,
      departureDate: b.departureDate,
      departureTime: b.departureTime,
      arrivalTime: b.arrivalTime,
      returnDate: b.returnDate ?? '',
      cabin: b.cabin,
      assignedAgent: b.assignedAgent,
      bookingStatus: b.bookingStatus,
      paymentStatus: b.paymentStatus,
      totalAmountUsd: String(b.totalAmountUsd),
      paidAmountUsd: String(b.paidAmountUsd),
      notes: b.notes ?? '',
      passengers: b.passengers.map((p) => ({ ...p })),
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmountUsd = Number(form.totalAmountUsd);
    const paidAmountUsd = Number(form.paidAmountUsd);

    const validation = validateBookingInput({
      clientName: form.clientName,
      clientEmail: form.clientEmail,
      originCode: form.originCode,
      destinationCode: form.destinationCode,
      departureDate: form.departureDate,
      returnDate: form.returnDate || undefined,
      airline: form.airline,
      flightNumber: form.flightNumber,
      totalAmountUsd,
      paidAmountUsd,
      passengers: form.passengers,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    const origin = findAirportByCode(form.originCode);
    const dest = findAirportByCode(form.destinationCode);
    const derivedPayment = derivePaymentStatusFromAmounts(
      totalAmountUsd,
      paidAmountUsd,
      form.paymentStatus
    );

    const payload = {
      clientName: form.clientName.trim(),
      clientEmail: form.clientEmail.trim(),
      clientPhone: form.clientPhone.trim() || '+998 90 000 00 00',
      originCode: form.originCode.trim().toUpperCase(),
      destinationCode: form.destinationCode.trim().toUpperCase(),
      originCity: origin?.city ?? form.originCode.toUpperCase(),
      destinationCity: dest?.city ?? form.destinationCode.toUpperCase(),
      airline: form.airline.trim(),
      flightNumber: form.flightNumber.trim().toUpperCase(),
      departureDate: form.departureDate,
      departureTime: form.departureTime || '09:00',
      arrivalTime: form.arrivalTime || '13:00',
      returnDate: form.returnDate || undefined,
      cabin: form.cabin,
      passengers: form.passengers.map((p) => ({
        ...p,
        fullName: p.fullName.trim(),
        nationality: p.nationality.trim().toUpperCase() || 'UZ',
      })),
      assignedAgent: form.assignedAgent,
      bookingStatus: form.bookingStatus,
      paymentStatus: derivedPayment,
      totalAmountUsd: Math.round(totalAmountUsd),
      paidAmountUsd: Math.round(paidAmountUsd),
      notes: form.notes.trim() || undefined,
    };

    if (editingBooking) {
      updateBooking(editingBooking.id, payload);
    } else {
      createBooking(payload);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Booking records
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Track reservations, passenger rosters, and payment collection separately from ticket issuance status.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap self-start sm:self-auto"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-fg)',
          }}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          New booking
        </button>
      </div>

      {/* Filters */}
      <div
        className="p-3.5 rounded-xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="relative lg:col-span-2 min-w-0">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="search"
            aria-label="Search bookings"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client, PNR ref, route (TAS), airline..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <select
          aria-label="Filter by booking status"
          value={bookingStatusFilter}
          onChange={(e) => setBookingStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border min-w-0"
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="All">All booking statuses</option>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by payment status"
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border min-w-0"
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="All">All payment statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-2 min-w-0">
          <input
            type="date"
            aria-label="Departure from date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="flex-1 min-w-0 px-2 py-2 text-xs rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
          <input
            type="date"
            aria-label="Departure to date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="flex-1 min-w-0 px-2 py-2 text-xs rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* Table */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No booking records found"
          description="Try clearing date or status filters, or create a new draft booking."
          actionLabel="New booking"
          onAction={openCreateModal}
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
                  <th className="py-3 px-3 font-medium whitespace-nowrap">Reference</th>
                  <th className="py-3 px-3 font-medium whitespace-nowrap">Client &amp; Pax</th>
                  <th className="py-3 px-3 font-medium whitespace-nowrap">Itinerary</th>
                  <th className="py-3 px-3 font-medium whitespace-nowrap">Departure</th>
                  <th className="py-3 px-3 font-medium whitespace-nowrap">Booking</th>
                  <th className="py-3 px-3 font-medium whitespace-nowrap">Payment</th>
                  <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Amount</th>
                  <th className="py-3 px-3 font-medium text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {filteredBookings.map((b) => (
                  <tr key={b.id} style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="py-2.5 px-3 font-mono-code font-semibold whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setDrawerBookingId(b.id)}
                        className="hover:underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        {b.reference}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 max-w-[165px]">
                      <div className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {b.clientName}
                      </div>
                      <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                        {b.passengers.length} pax · {b.assignedAgent}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 max-w-[185px]">
                      <div className="font-mono-code font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                        {b.originCode} → {b.destinationCode}
                      </div>
                      <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                        {b.airline} · {b.flightNumber} ({b.cabin})
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap tabular-nums">
                      <div style={{ color: 'var(--text-primary)' }}>{formatShortDate(b.departureDate)}</div>
                      <div className="text-[11px] font-mono-code" style={{ color: 'var(--text-muted)' }}>
                        {b.departureTime} – {b.arrivalTime}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge label={b.bookingStatus} tone={getBookingStatusTone(b.bookingStatus)} />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge label={b.paymentStatus} tone={getPaymentStatusTone(b.paymentStatus)} />
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums">
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatMoneyFromUsd(b.totalAmountUsd, currency)}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Paid {formatMoneyFromUsd(b.paidAmountUsd, currency)}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDrawerBookingId(b.id)}
                          aria-label={`Inspect ${b.reference}`}
                          className="p-1.5 rounded-md border"
                          style={{
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(b)}
                          aria-label={`Edit ${b.reference}`}
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
                          onClick={() => setDeleteTarget(b)}
                          aria-label={`Delete ${b.reference}`}
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

      {/* Create / Edit Booking Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBooking ? `Edit booking ${editingBooking.reference}` : 'Create booking record'}
        subtitle="Demo reservation record — does not issue live GDS tickets or process payments"
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSaveBooking} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Client name *
              </label>
              <input
                type="text"
                value={form.clientName}
                onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: errors.clientName ? 'var(--danger-fg)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.clientName && <p className="text-[11px] mt-1" style={{ color: 'var(--danger-fg)' }}>{errors.clientName}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Client email *
              </label>
              <input
                type="email"
                value={form.clientEmail}
                onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: errors.clientEmail ? 'var(--danger-fg)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.clientEmail && <p className="text-[11px] mt-1" style={{ color: 'var(--danger-fg)' }}>{errors.clientEmail}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Client phone
              </label>
              <input
                type="text"
                value={form.clientPhone}
                onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
                placeholder="+998 90 ..."
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Origin IATA *
              </label>
              <input
                type="text"
                maxLength={3}
                value={form.originCode}
                onChange={(e) => setForm((f) => ({ ...f, originCode: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 text-xs rounded-lg border font-mono-code"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: errors.originCode ? 'var(--danger-fg)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.originCode && <p className="text-[11px] mt-1" style={{ color: 'var(--danger-fg)' }}>{errors.originCode}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Dest IATA *
              </label>
              <input
                type="text"
                maxLength={3}
                value={form.destinationCode}
                onChange={(e) => setForm((f) => ({ ...f, destinationCode: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 text-xs rounded-lg border font-mono-code"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: errors.destinationCode ? 'var(--danger-fg)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.destinationCode && <p className="text-[11px] mt-1" style={{ color: 'var(--danger-fg)' }}>{errors.destinationCode}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Airline *
              </label>
              <input
                type="text"
                value={form.airline}
                onChange={(e) => setForm((f) => ({ ...f, airline: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: errors.airline ? 'var(--danger-fg)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Flight number *
              </label>
              <input
                type="text"
                value={form.flightNumber}
                onChange={(e) => setForm((f) => ({ ...f, flightNumber: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border font-mono-code"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: errors.flightNumber ? 'var(--danger-fg)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Departure date *
              </label>
              <input
                type="date"
                value={form.departureDate}
                onChange={(e) => setForm((f) => ({ ...f, departureDate: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: errors.departureDate ? 'var(--danger-fg)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Return date
              </label>
              <input
                type="date"
                value={form.returnDate}
                onChange={(e) => setForm((f) => ({ ...f, returnDate: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: errors.returnDate ? 'var(--danger-fg)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.returnDate && <p className="text-[11px] mt-1" style={{ color: 'var(--danger-fg)' }}>{errors.returnDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Cabin class
              </label>
              <select
                value={form.cabin}
                onChange={(e) => setForm((f) => ({ ...f, cabin: e.target.value as CabinClass }))}
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {CABINS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Assigned agent
              </label>
              <select
                value={form.assignedAgent}
                onChange={(e) => setForm((f) => ({ ...f, assignedAgent: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border"
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Booking status
              </label>
              <select
                value={form.bookingStatus}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bookingStatus: e.target.value as BookingStatus }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {BOOKING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Payment status
              </label>
              <select
                value={form.paymentStatus}
                onChange={(e) =>
                  setForm((f) => ({ ...f, paymentStatus: e.target.value as PaymentStatus }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Total amount (USD) *
              </label>
              <input
                type="number"
                min={1}
                value={form.totalAmountUsd}
                onChange={(e) => setForm((f) => ({ ...f, totalAmountUsd: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border tabular-nums"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: errors.totalAmountUsd ? 'var(--danger-fg)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.totalAmountUsd && <p className="text-[11px] mt-1" style={{ color: 'var(--danger-fg)' }}>{errors.totalAmountUsd}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Collected (USD) *
              </label>
              <input
                type="number"
                min={0}
                value={form.paidAmountUsd}
                onChange={(e) => setForm((f) => ({ ...f, paidAmountUsd: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border tabular-nums"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: errors.paidAmountUsd ? 'var(--danger-fg)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.paidAmountUsd && <p className="text-[11px] mt-1" style={{ color: 'var(--danger-fg)' }}>{errors.paidAmountUsd}</p>}
            </div>
          </div>

          {/* Passengers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Passengers ({form.passengers.length})
              </label>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    passengers: [
                      ...f.passengers,
                      {
                        id: `p-${Date.now().toString(36)}`,
                        fullName: '',
                        type: 'Adult',
                        nationality: 'UZ',
                      },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add passenger
              </button>
            </div>
            {errors.passengers && <p className="text-xs" style={{ color: 'var(--danger-fg)' }}>{errors.passengers}</p>}

            <div className="space-y-2">
              {form.passengers.map((p, idx) => (
                <div key={p.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    placeholder={`Passenger ${idx + 1} full name`}
                    value={p.fullName}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        passengers: f.passengers.map((item) =>
                          item.id === p.id ? { ...item, fullName: e.target.value } : item
                        ),
                      }))
                    }
                    className="col-span-6 px-2.5 py-1.5 text-xs rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <select
                    aria-label="Passenger type"
                    value={p.type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        passengers: f.passengers.map((item) =>
                          item.id === p.id
                            ? { ...item, type: e.target.value as Passenger['type'] }
                            : item
                        ),
                      }))
                    }
                    className="col-span-3 px-2 py-1.5 text-xs rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="Adult">Adult</option>
                    <option value="Child">Child</option>
                    <option value="Infant">Infant</option>
                  </select>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="UZ"
                    aria-label="Nationality code"
                    value={p.nationality}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        passengers: f.passengers.map((item) =>
                          item.id === p.id
                            ? { ...item, nationality: e.target.value.toUpperCase() }
                            : item
                        ),
                      }))
                    }
                    className="col-span-2 px-2 py-1.5 text-xs rounded-lg border font-mono-code"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    type="button"
                    disabled={form.passengers.length <= 1}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        passengers: f.passengers.filter((item) => item.id !== p.id),
                      }))
                    }
                    aria-label="Remove passenger"
                    className="col-span-1 p-1.5 rounded border flex justify-center disabled:opacity-30"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--danger-fg)',
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Passport numbers and payment card details are intentionally excluded from demo browser storage.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Booking notes
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
            >
              {editingBooking ? 'Save booking' : 'Create booking'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Booking Details Drawer */}
      <Drawer
        open={Boolean(drawerBooking)}
        onClose={() => setDrawerBookingId(null)}
        title={drawerBooking ? `${drawerBooking.reference} · ${drawerBooking.clientName}` : ''}
        subtitle={
          drawerBooking
            ? `${drawerBooking.originCity} (${drawerBooking.originCode}) → ${drawerBooking.destinationCity} (${drawerBooking.destinationCode})`
            : undefined
        }
      >
        {drawerBooking && (
          <div className="space-y-5">
            {drawerBooking.bookingStatus === 'Draft' && (
              <div
                className="p-3 rounded-lg border flex items-start gap-2.5 text-xs"
                style={{
                  backgroundColor: 'var(--warning-bg)',
                  borderColor: 'var(--warning-border)',
                  color: 'var(--warning-fg)',
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Draft booking only: no airline ticket has been issued and no GDS PNR has been confirmed.
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <StatusBadge
                  label={`Booking: ${drawerBooking.bookingStatus}`}
                  tone={getBookingStatusTone(drawerBooking.bookingStatus)}
                />
                <StatusBadge
                  label={`Payment: ${drawerBooking.paymentStatus}`}
                  tone={getPaymentStatusTone(drawerBooking.paymentStatus)}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(drawerBooking)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(drawerBooking)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border"
                  style={{ borderColor: 'var(--danger-border)', color: 'var(--danger-fg)' }}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Aviation Itinerary */}
            <div
              className="p-4 rounded-xl border space-y-3"
              style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold inline-flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  {drawerBooking.airline}
                </span>
                <span className="font-mono-code font-semibold" style={{ color: 'var(--accent)' }}>
                  {drawerBooking.flightNumber} · {drawerBooking.cabin}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-bold font-mono-code">{drawerBooking.originCode}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {drawerBooking.originCity} · {drawerBooking.departureTime}
                  </div>
                </div>
                <div className="flex-1 border-t border-dashed mx-2" style={{ borderColor: 'var(--border-strong)' }} />
                <div className="text-right">
                  <div className="text-lg font-bold font-mono-code">{drawerBooking.destinationCode}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {drawerBooking.destinationCity} · {drawerBooking.arrivalTime}
                  </div>
                </div>
              </div>
              <div className="text-xs flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <span>Departure: {formatShortDate(drawerBooking.departureDate)}</span>
                {drawerBooking.returnDate && (
                  <span>Return: {formatShortDate(drawerBooking.returnDate)}</span>
                )}
              </div>
            </div>

            {/* Payment Breakdown */}
            <div
              className="p-4 rounded-xl border grid grid-cols-3 gap-3 text-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Total amount</div>
                <div className="text-sm font-bold tabular-nums mt-0.5">
                  {formatMoneyFromUsd(drawerBooking.totalAmountUsd, currency)}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Collected</div>
                <div className="text-sm font-bold tabular-nums mt-0.5" style={{ color: 'var(--success-fg)' }}>
                  {formatMoneyFromUsd(drawerBooking.paidAmountUsd, currency)}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Balance due</div>
                <div className="text-sm font-bold tabular-nums mt-0.5">
                  {formatMoneyFromUsd(
                    Math.max(0, drawerBooking.totalAmountUsd - drawerBooking.paidAmountUsd),
                    currency
                  )}
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold">
                Passengers ({drawerBooking.passengers.length})
              </h4>
              <div className="divide-y rounded-xl border" style={{ borderColor: 'var(--border-subtle)' }}>
                {drawerBooking.passengers.map((p) => (
                  <div key={p.id} className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium">{p.fullName}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {p.type} · Nationality {p.nationality}
                      </div>
                    </div>
                    {p.seatPreference && (
                      <span className="font-mono-code text-xs" style={{ color: 'var(--accent)' }}>
                        Seat {p.seatPreference}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Client contact:</span>{' '}
                {drawerBooking.clientEmail} · {drawerBooking.clientPhone}
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Assigned agent:</span>{' '}
                {drawerBooking.assignedAgent}
              </div>
              {drawerBooking.notes && (
                <div className="pt-2">
                  <span style={{ color: 'var(--text-muted)' }}>Notes:</span> {drawerBooking.notes}
                </div>
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
            if (drawerBookingId === deleteTarget.id) setDrawerBookingId(null);
            deleteBooking(deleteTarget.id);
          }
        }}
        title="Delete booking record?"
        description={`Are you sure you want to permanently remove booking ${deleteTarget?.reference} for ${deleteTarget?.clientName}?`}
        confirmLabel="Delete booking"
      />
    </div>
  );
}
