import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  PlaneTakeoff,
  Plus,
  Ticket,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { formatMoneyFromUsd } from '../../lib/currency';
import { formatDateTime, formatShortDate } from '../../lib/date';
import {
  computeLeadSources,
  computeOverviewMetrics,
  computeRevenueTrend,
  getUpcomingDepartures,
  type DateRangePreset,
} from '../../lib/metrics';
import { useCrm } from '../../store/CrmContext';
import { LeadSourceChart, RevenueTrendChart } from '../ui/Charts';
import {
  getBookingStatusTone,
  getPaymentStatusTone,
  StatusBadge,
} from '../ui/StatusBadge';

const RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All records' },
];

export function OverviewPage() {
  const {
    state,
    navigate,
    setPendingBookingModalOpen,
    setPendingLeadModalOpen,
  } = useCrm();

  const [dateRange, setDateRange] = useState<DateRangePreset>(
    state.profile.defaultDateRange ?? '90d'
  );

  const currency = state.profile.preferredCurrency;
  const firstName = state.profile.fullName.split(' ')[0] || 'Team';

  const metrics = useMemo(
    () => computeOverviewMetrics(state.bookings, state.leads, dateRange),
    [state.bookings, state.leads, dateRange]
  );

  const revenueTrend = useMemo(
    () => computeRevenueTrend(state.bookings, dateRange),
    [state.bookings, dateRange]
  );

  const leadSources = useMemo(
    () => computeLeadSources(state.leads, dateRange),
    [state.leads, dateRange]
  );

  const recentBookings = useMemo(
    () =>
      [...state.bookings]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [state.bookings]
  );

  const upcomingDepartures = useMemo(
    () => getUpcomingDepartures(state.bookings, '2026-11-13', 5),
    [state.bookings]
  );

  const recentActivity = state.activityLog.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Greeting + Date Filter + Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2
            className="text-xl sm:text-2xl font-semibold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Welcome back, {firstName}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            StarAviaTravel operations snapshot derived from stored demo records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="inline-flex items-center p-1 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
            role="group"
            aria-label="Date range filter"
          >
            {RANGE_OPTIONS.map((opt) => {
              const active = dateRange === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDateRange(opt.value)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                  style={{
                    backgroundColor: active ? 'var(--accent)' : 'transparent',
                    color: active ? 'var(--accent-fg)' : 'var(--text-secondary)',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setPendingLeadModalOpen(true);
              navigate('leads');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
            Add lead
          </button>

          <button
            type="button"
            onClick={() => {
              setPendingBookingModalOpen(true);
              navigate('bookings');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-fg)',
            }}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            New booking
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div
          className="p-4 sm:p-5 rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Gross booking value
            </span>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden="true" />
          </div>
          <div
            className="text-2xl font-bold mt-2 tabular-nums tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {formatMoneyFromUsd(metrics.grossBookingValueUsd, currency)}
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Total fare &amp; package value (not agency net profit)
          </p>
        </div>

        <div
          className="p-4 sm:p-5 rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Collected payments
            </span>
            <Wallet className="w-4 h-4" style={{ color: 'var(--gold-detail)' }} aria-hidden="true" />
          </div>
          <div
            className="text-2xl font-bold mt-2 tabular-nums tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {formatMoneyFromUsd(metrics.collectedPaymentsUsd, currency)}
          </div>
          <p className="text-[11px] mt-1.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>
            Outstanding balance: {formatMoneyFromUsd(metrics.outstandingBalanceUsd, currency)}
          </p>
        </div>

        <div
          className="p-4 sm:p-5 rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Bookings
            </span>
            <Ticket className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden="true" />
          </div>
          <div
            className="text-2xl font-bold mt-2 tabular-nums tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {metrics.totalBookings}
          </div>
          <p className="text-[11px] mt-1.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {metrics.ticketedBookings} ticketed · excludes cancelled records
          </p>
        </div>

        <div
          className="p-4 sm:p-5 rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Open leads
            </span>
            <Users className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden="true" />
          </div>
          <div
            className="text-2xl font-bold mt-2 tabular-nums tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {metrics.openLeadsCount}
          </div>
          <p className="text-[11px] mt-1.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>
            Est. budget {formatMoneyFromUsd(metrics.pipelineValueUsd, currency)} · {metrics.wonLeadsCount} won
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div
          className="xl:col-span-2 p-5 rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Booking value &amp; collected payments
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Gross sales volume vs client payments received across active bookings
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('bookings')}
              className="inline-flex items-center gap-1 text-xs font-medium hover:underline whitespace-nowrap"
              style={{ color: 'var(--accent)' }}
            >
              View bookings
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <RevenueTrendChart data={revenueTrend} currency={currency} />
        </div>

        <div
          className="p-5 rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Lead sources
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Channel distribution in selected window
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('leads')}
              className="inline-flex items-center gap-1 text-xs font-medium hover:underline whitespace-nowrap"
              style={{ color: 'var(--accent)' }}
            >
              Pipeline
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <LeadSourceChart data={leadSources} />
        </div>
      </div>

      {/* Recent Bookings + Upcoming Departures */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Bookings Table */}
        <div
          className="xl:col-span-2 rounded-xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="px-5 py-4 flex items-center justify-between gap-3 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Recent bookings
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Latest client reservations and payment status
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('bookings')}
              className="inline-flex items-center gap-1 text-xs font-medium hover:underline whitespace-nowrap"
              style={{ color: 'var(--accent)' }}
            >
              All records
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

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
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">Reference</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">Client</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">Route</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">Booking</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">Payment</th>
                  <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {recentBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="transition-colors hover:opacity-95"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <td className="py-2.5 px-3 font-mono-code font-medium whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => navigate('bookings')}
                        className="hover:underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        {b.reference}
                      </button>
                    </td>
                    <td
                      className="py-2.5 px-3 font-medium max-w-[140px] truncate"
                      style={{ color: 'var(--text-primary)' }}
                      title={b.clientName}
                    >
                      {b.clientName}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-mono-code font-medium" style={{ color: 'var(--text-primary)' }}>
                        {b.originCode} → {b.destinationCode}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {b.flightNumber}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge label={b.bookingStatus} tone={getBookingStatusTone(b.bookingStatus)} />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge label={b.paymentStatus} tone={getPaymentStatusTone(b.paymentStatus)} />
                    </td>
                    <td
                      className="py-2.5 px-3 text-right font-semibold tabular-nums whitespace-nowrap"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {formatMoneyFromUsd(b.totalAmountUsd, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Departures */}
        <div
          className="rounded-xl border flex flex-col"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="px-5 py-4 flex items-center justify-between gap-2 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Upcoming departures
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Scheduled flights from Nov 13, 2026
              </p>
            </div>
            <PlaneTakeoff className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden="true" />
          </div>

          <div className="divide-y flex-1" style={{ borderColor: 'var(--border-subtle)' }}>
            {upcomingDepartures.length === 0 ? (
              <div className="p-5 text-xs" style={{ color: 'var(--text-muted)' }}>
                No upcoming departures scheduled.
              </div>
            ) : (
              upcomingDepartures.map((b) => (
                <div key={b.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="font-mono-code text-xs font-semibold whitespace-nowrap shrink-0"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {b.originCode} → {b.destinationCode}
                      </span>
                      <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        · {b.airline} ({b.flightNumber})
                      </span>
                    </div>
                    <div className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                      {b.clientName} · {b.passengers.length} pax
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className="text-xs font-medium tabular-nums inline-flex items-center gap-1 whitespace-nowrap"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Calendar className="w-3 h-3 shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                      {formatShortDate(b.departureDate)}
                    </div>
                    <div className="text-[11px] font-mono-code mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {b.departureTime}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity + Quick Workspace Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="lg:col-span-2 rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="px-5 py-4 flex items-center justify-between gap-3 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recent activity
            </h3>
            <button
              type="button"
              onClick={() => navigate('activity')}
              className="inline-flex items-center gap-1 text-xs font-medium hover:underline whitespace-nowrap"
              style={{ color: 'var(--accent)' }}
            >
              Full audit log
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {recentActivity.map((act) => (
              <div key={act.id} className="px-5 py-3 flex items-start justify-between gap-4 text-xs">
                <div className="min-w-0">
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {act.actor}
                  </span>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>{act.action.toLowerCase()}</span>{' '}
                  <span className="font-medium" style={{ color: 'var(--accent)' }}>
                    {act.entityLabel}
                  </span>
                  {act.details && (
                    <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      {act.details}
                    </div>
                  )}
                </div>
                <span className="text-[11px] whitespace-nowrap shrink-0 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {formatDateTime(act.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="p-5 rounded-xl border space-y-3"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Quick links to records
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Jump directly to operational queues and public website content.
          </p>
          <div className="space-y-2 pt-1">
            {[
              { label: 'Ticket search (demo fares)', section: 'ticket-search' as const, count: `${state.savedSearches.length} saved` },
              { label: 'Telegram customer inbox', section: 'telegram' as const, count: `${state.telegramThreads.reduce((s, t) => s + t.unreadCount, 0)} unread` },
              { label: 'Published website offers', section: 'offers' as const, count: `${state.offers.filter((o) => o.status === 'Published').length} live` },
              { label: 'Integration endpoints', section: 'integrations' as const, count: '6 services' },
            ].map((item) => (
              <button
                key={item.section}
                type="button"
                onClick={() => navigate(item.section)}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-left text-xs transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <span className="font-medium">{item.label}</span>
                <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <span className="tabular-nums">{item.count}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
