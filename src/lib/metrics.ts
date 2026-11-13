import { findAirportByCode } from '../data/airports';
import type {
  Booking,
  DemoFlightResult,
  FlightSearchParams,
  Lead,
  LeadSource,
} from '../types/crm';

export type DateRangePreset = '7d' | '30d' | '90d' | 'all';

export interface OverviewMetrics {
  grossBookingValueUsd: number;
  collectedPaymentsUsd: number;
  outstandingBalanceUsd: number;
  totalBookings: number;
  ticketedBookings: number;
  openLeadsCount: number;
  wonLeadsCount: number;
  pipelineValueUsd: number;
}

export interface RevenueTrendPoint {
  key: string;
  label: string;
  bookingValueUsd: number;
  collectedUsd: number;
  bookingCount: number;
}

export interface LeadSourceDatum {
  source: LeadSource;
  count: number;
  sharePct: number;
}

export function getCutoffDateIso(range: DateRangePreset, referenceIso: string): string | null {
  if (range === 'all') return null;
  const ref = new Date(referenceIso);
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  ref.setDate(ref.getDate() - days);
  return ref.toISOString().slice(0, 10);
}

export function filterBookingsByRange(
  bookings: Booking[],
  range: DateRangePreset,
  referenceIso = '2026-11-13'
): Booking[] {
  const cutoff = getCutoffDateIso(range, referenceIso);
  if (!cutoff) return bookings;
  return bookings.filter((b) => b.createdAt.slice(0, 10) >= cutoff);
}

export function filterLeadsByRange(
  leads: Lead[],
  range: DateRangePreset,
  referenceIso = '2026-11-13'
): Lead[] {
  const cutoff = getCutoffDateIso(range, referenceIso);
  if (!cutoff) return leads;
  return leads.filter((l) => l.createdAt.slice(0, 10) >= cutoff);
}

export function computeOverviewMetrics(
  bookings: Booking[],
  leads: Lead[],
  range: DateRangePreset,
  referenceIso = '2026-11-13'
): OverviewMetrics {
  const scopedBookings = filterBookingsByRange(bookings, range, referenceIso).filter(
    (b) => b.bookingStatus !== 'Cancelled'
  );
  const scopedLeads = filterLeadsByRange(leads, range, referenceIso);

  const grossBookingValueUsd = scopedBookings.reduce((sum, b) => sum + b.totalAmountUsd, 0);
  const collectedPaymentsUsd = scopedBookings.reduce(
    (sum, b) => sum + (b.paymentStatus === 'Refunded' ? 0 : b.paidAmountUsd),
    0
  );
  const outstandingBalanceUsd = Math.max(0, grossBookingValueUsd - collectedPaymentsUsd);
  const ticketedBookings = scopedBookings.filter((b) => b.bookingStatus === 'Ticketed').length;

  const openLeads = scopedLeads.filter((l) => l.stage !== 'Won' && l.stage !== 'Lost');
  const wonLeads = scopedLeads.filter((l) => l.stage === 'Won');
  const pipelineValueUsd = openLeads.reduce((sum, l) => sum + l.budgetUsd, 0);

  return {
    grossBookingValueUsd,
    collectedPaymentsUsd,
    outstandingBalanceUsd,
    totalBookings: scopedBookings.length,
    ticketedBookings,
    openLeadsCount: openLeads.length,
    wonLeadsCount: wonLeads.length,
    pipelineValueUsd,
  };
}

export function computeRevenueTrend(
  bookings: Booking[],
  range: DateRangePreset,
  referenceIso = '2026-11-13'
): RevenueTrendPoint[] {
  const activeBookings = filterBookingsByRange(bookings, range, referenceIso).filter(
    (b) => b.bookingStatus !== 'Cancelled'
  );

  // Group by month (YYYY-MM) for 90d/all or by week/day bucket for 7d/30d
  const buckets = new Map<string, RevenueTrendPoint>();

  if (range === '7d') {
    const ref = new Date(referenceIso);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(ref);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      buckets.set(key, { key, label, bookingValueUsd: 0, collectedUsd: 0, bookingCount: 0 });
    }
    for (const b of activeBookings) {
      const day = b.createdAt.slice(0, 10);
      const pt = buckets.get(day);
      if (pt) {
        pt.bookingValueUsd += b.totalAmountUsd;
        pt.collectedUsd += b.paymentStatus === 'Refunded' ? 0 : b.paidAmountUsd;
        pt.bookingCount += 1;
      }
    }
    return Array.from(buckets.values());
  }

  // Group by month across sorted dates
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' });
  const sorted = [...activeBookings].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const b of sorted) {
    const key = b.createdAt.slice(0, 7);
    if (!buckets.has(key)) {
      const [y, m] = key.split('-').map(Number);
      const label = monthFormatter.format(new Date(y, (m || 1) - 1, 1));
      buckets.set(key, { key, label, bookingValueUsd: 0, collectedUsd: 0, bookingCount: 0 });
    }
    const pt = buckets.get(key)!;
    pt.bookingValueUsd += b.totalAmountUsd;
    pt.collectedUsd += b.paymentStatus === 'Refunded' ? 0 : b.paidAmountUsd;
    pt.bookingCount += 1;
  }

  return Array.from(buckets.values());
}

export function computeLeadSources(
  leads: Lead[],
  range: DateRangePreset,
  referenceIso = '2026-11-13'
): LeadSourceDatum[] {
  const scoped = filterLeadsByRange(leads, range, referenceIso);
  const total = scoped.length || 1;
  const counts = new Map<LeadSource, number>();

  for (const lead of scoped) {
    counts.set(lead.source, (counts.get(lead.source) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([source, count]) => ({
      source,
      count,
      sharePct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getUpcomingDepartures(
  bookings: Booking[],
  referenceIso = '2026-11-13',
  limit = 5
): Booking[] {
  return bookings
    .filter((b) => b.bookingStatus !== 'Cancelled' && b.departureDate >= referenceIso)
    .sort((a, b) => {
      const cmp = a.departureDate.localeCompare(b.departureDate);
      return cmp !== 0 ? cmp : a.departureTime.localeCompare(b.departureTime);
    })
    .slice(0, limit);
}

const DEMO_CARRIERS = [
  { name: 'Uzbekistan Airways', code: 'HY', baseMultiplier: 1.0, hub: 'TAS' },
  { name: 'Turkish Airlines', code: 'TK', baseMultiplier: 1.16, hub: 'IST' },
  { name: 'flydubai', code: 'FZ', baseMultiplier: 0.92, hub: 'DXB' },
  { name: 'Qatar Airways', code: 'QR', baseMultiplier: 1.24, hub: 'DOH' },
  { name: 'Centrum Air', code: 'C6', baseMultiplier: 0.86, hub: 'TAS' },
  { name: 'Lufthansa', code: 'LH', baseMultiplier: 1.28, hub: 'FRA' },
];

export function generateDemoFlightResults(params: FlightSearchParams): DemoFlightResult[] {
  const origin = findAirportByCode(params.originCode);
  const dest = findAirportByCode(params.destinationCode);
  if (!origin || !dest) return [];

  const seedHash = (origin.code + dest.code + params.departureDate)
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const cabinMultiplier =
    params.cabin === 'First'
      ? 3.4
      : params.cabin === 'Business'
      ? 2.25
      : params.cabin === 'Premium Economy'
      ? 1.45
      : 1;

  const tripMultiplier = params.tripType === 'round-trip' ? 1.85 : 1;
  const baseFare = 240 + (seedHash % 190);

  return DEMO_CARRIERS.map((carrier, idx) => {
    const isDirect = idx % 2 === 0 || carrier.code === 'HY';
    const depHour = 5 + ((seedHash + idx * 3) % 16);
    const depMin = (idx * 15) % 60;
    const durationMinutes = (isDirect ? 215 : 410) + ((seedHash + idx * 29) % 135);
    const arrTotalMinutes = depHour * 60 + depMin + durationMinutes;
    const arrHour = Math.floor(arrTotalMinutes / 60) % 24;
    const arrMin = arrTotalMinutes % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    const adultPrice = Math.round(
      baseFare * carrier.baseMultiplier * cabinMultiplier * tripMultiplier
    );
    const totalPrice = Math.round(
      adultPrice * params.adults +
        adultPrice * 0.75 * params.children +
        adultPrice * 0.15 * params.infants
    );

    return {
      id: `demo-flt-${carrier.code}-${idx}-${seedHash}`,
      airline: carrier.name,
      airlineCode: carrier.code,
      flightNumber: `${carrier.code} ${300 + ((seedHash + idx * 37) % 650)}`,
      originCode: origin.code,
      destinationCode: dest.code,
      originCity: origin.city,
      destinationCity: dest.city,
      departureDate: params.departureDate,
      departureTime: `${pad(depHour)}:${pad(depMin)}`,
      arrivalTime: `${pad(arrHour)}:${pad(arrMin)}`,
      durationMinutes,
      stops: isDirect ? 0 : 1,
      stopCity: isDirect ? undefined : carrier.hub === origin.code ? 'IST' : carrier.hub,
      cabin: params.cabin,
      priceUsdPerAdult: adultPrice,
      totalPriceUsd: totalPrice,
      baggage: params.cabin === 'Business' || params.cabin === 'First' ? '2 × 32 kg' : '23 kg + 8 kg',
      refundable: idx % 2 === 1 || params.cabin === 'Business' || params.cabin === 'First',
      seatsRemainingDemo: 2 + ((seedHash + idx) % 7),
    };
  });
}
