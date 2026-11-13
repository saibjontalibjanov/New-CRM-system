import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  BookmarkPlus,
  Info,
  Plane,
  Search,
  Ticket,
} from 'lucide-react';
import { formatMoneyFromUsd } from '../../lib/currency';
import { formatDuration } from '../../lib/date';
import { generateDemoFlightResults } from '../../lib/metrics';
import { validateFlightSearch } from '../../lib/validation';
import { useCrm } from '../../store/CrmContext';
import type {
  CabinClass,
  DemoFlightResult,
  FlightSearchParams,
  TripType,
} from '../../types/crm';
import { AirportAutocomplete } from '../ui/AirportAutocomplete';
import { EmptyState } from '../ui/EmptyState';

export function TicketSearchPage() {
  const {
    state,
    navigate,
    saveFlightSearch,
    setPendingDraftFlight,
    pendingSearchParams,
    setPendingSearchParams,
  } = useCrm();

  const currency = state.profile.preferredCurrency;

  const [params, setParams] = useState<FlightSearchParams>({
    tripType: 'round-trip',
    originCode: 'TAS',
    destinationCode: 'IST',
    departureDate: '2026-12-05',
    returnDate: '2026-12-12',
    adults: 1,
    children: 0,
    infants: 0,
    cabin: 'Economy',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<DemoFlightResult[] | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'departure'>('price');
  const [nonStopOnly, setNonStopOnly] = useState(false);
  const [refundableOnly, setRefundableOnly] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');

  useEffect(() => {
    if (pendingSearchParams) {
      setParams(pendingSearchParams);
      const check = validateFlightSearch(pendingSearchParams);
      if (check.valid) {
        setResults(generateDemoFlightResults(pendingSearchParams));
        setErrors({});
      }
      setPendingSearchParams(null);
    }
  }, [pendingSearchParams, setPendingSearchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateFlightSearch(params);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setResults(generateDemoFlightResults(params));
  };

  const handleSwapAirports = () => {
    setParams((p) => ({
      ...p,
      originCode: p.destinationCode,
      destinationCode: p.originCode,
    }));
  };

  const filteredResults = useMemo(() => {
    if (!results) return [];
    return results
      .filter((r) => {
        if (nonStopOnly && r.stops > 0) return false;
        if (refundableOnly && !r.refundable) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'duration') return a.durationMinutes - b.durationMinutes;
        if (sortBy === 'departure') return a.departureTime.localeCompare(b.departureTime);
        return a.totalPriceUsd - b.totalPriceUsd;
      });
  }, [results, nonStopOnly, refundableOnly, sortBy]);

  const handleSaveSearch = () => {
    const validation = validateFlightSearch(params);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    const label =
      saveLabel.trim() ||
      `${params.originCode} → ${params.destinationCode} · ${params.cabin}`;
    saveFlightSearch(label, params);
    setSaveLabel('');
  };

  const handleCreateDraftBooking = (flight: DemoFlightResult) => {
    setPendingDraftFlight(flight);
    navigate('bookings');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Ticket search
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Search routes using our airport dataset and generate sample quotes or draft bookings.
          </p>
        </div>
      </div>

      {/* Explicit Demo Notice */}
      <div
        className="px-4 py-3 rounded-xl border flex items-start gap-2.5 text-xs"
        style={{
          backgroundColor: 'var(--info-bg)',
          borderColor: 'var(--info-border)',
          color: 'var(--info-fg)',
        }}
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          <strong>Demo fare simulator:</strong> Displayed flight schedules, seat counts, and fares are generated locally for demonstration and are not live GDS or airline inventory.
        </span>
      </div>

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        className="p-5 rounded-xl border space-y-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex items-center p-1 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {(['round-trip', 'one-way'] as TripType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setParams((p) => ({ ...p, tripType: type }))}
                className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                style={{
                  backgroundColor: params.tripType === type ? 'var(--accent)' : 'transparent',
                  color: params.tripType === type ? 'var(--accent-fg)' : 'var(--text-secondary)',
                }}
              >
                {type === 'round-trip' ? 'Round-trip' : 'One-way'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={saveLabel}
              onChange={(e) => setSaveLabel(e.target.value)}
              placeholder="Optional search label..."
              aria-label="Saved search label"
              className="px-3 py-1.5 text-xs rounded-lg border w-44"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              onClick={handleSaveSearch}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <BookmarkPlus className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              Save search
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
          <div className="md:col-span-4">
            <AirportAutocomplete
              label="From"
              value={params.originCode}
              onChange={(code) => setParams((p) => ({ ...p, originCode: code }))}
              error={errors.originCode}
            />
          </div>

          <div className="md:col-span-1 flex md:justify-center md:pt-6">
            <button
              type="button"
              onClick={handleSwapAirports}
              aria-label="Swap origin and destination"
              className="p-2 rounded-lg border transition-colors"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div className="md:col-span-4">
            <AirportAutocomplete
              label="To"
              value={params.destinationCode}
              onChange={(code) => setParams((p) => ({ ...p, destinationCode: code }))}
              error={errors.destinationCode}
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Cabin class
            </label>
            <select
              value={params.cabin}
              onChange={(e) => setParams((p) => ({ ...p, cabin: e.target.value as CabinClass }))}
              className="w-full px-3 py-2 text-sm rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="Economy">Economy</option>
              <option value="Premium Economy">Premium Economy</option>
              <option value="Business">Business</option>
              <option value="First">First</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Departure date
            </label>
            <input
              type="date"
              value={params.departureDate}
              onChange={(e) => setParams((p) => ({ ...p, departureDate: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: errors.departureDate ? 'var(--danger-fg)' : 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
            {errors.departureDate && <p className="text-[11px] mt-1" style={{ color: 'var(--danger-fg)' }}>{errors.departureDate}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Return date
            </label>
            <input
              type="date"
              disabled={params.tripType === 'one-way'}
              value={params.tripType === 'one-way' ? '' : params.returnDate}
              onChange={(e) => setParams((p) => ({ ...p, returnDate: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-lg border disabled:opacity-50"
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
              Adults (12+)
            </label>
            <input
              type="number"
              min={1}
              max={9}
              value={params.adults}
              onChange={(e) => setParams((p) => ({ ...p, adults: Number(e.target.value) || 1 }))}
              className="w-full px-3 py-2 text-xs rounded-lg border tabular-nums"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: errors.adults ? 'var(--danger-fg)' : 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Children (2–11)
            </label>
            <input
              type="number"
              min={0}
              max={8}
              value={params.children}
              onChange={(e) => setParams((p) => ({ ...p, children: Math.max(0, Number(e.target.value) || 0) }))}
              className="w-full px-3 py-2 text-xs rounded-lg border tabular-nums"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Infants (&lt;2)
            </label>
            <input
              type="number"
              min={0}
              max={4}
              value={params.infants}
              onChange={(e) => setParams((p) => ({ ...p, infants: Math.max(0, Number(e.target.value) || 0) }))}
              className="w-full px-3 py-2 text-xs rounded-lg border tabular-nums"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: errors.infants ? 'var(--danger-fg)' : 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
            {errors.infants && <p className="text-[11px] mt-1" style={{ color: 'var(--danger-fg)' }}>{errors.infants}</p>}
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-opacity hover:opacity-90 h-[34px]"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-fg)',
            }}
          >
            <Search className="w-3.5 h-3.5" aria-hidden="true" />
            Search demo flights
          </button>
        </div>
      </form>

      {/* Results */}
      {results === null ? (
        <EmptyState
          icon={Plane}
          title="Enter route and dates to preview sample itineraries"
          description="Use the airport autocomplete above to search demo fares and create a draft booking."
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Showing <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{filteredResults.length}</span> simulated results for{' '}
              <span className="font-mono-code font-semibold">
                {params.originCode} → {params.destinationCode}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nonStopOnly}
                  onChange={(e) => setNonStopOnly(e.target.checked)}
                />
                <span>Direct only</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={refundableOnly}
                  onChange={(e) => setRefundableOnly(e.target.checked)}
                />
                <span>Refundable</span>
              </label>

              <select
                aria-label="Sort flight results"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price' | 'duration' | 'departure')}
                className="px-2.5 py-1.5 text-xs rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="price">Sort: Lowest fare</option>
                <option value="duration">Sort: Shortest duration</option>
                <option value="departure">Sort: Earliest departure</option>
              </select>
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="No demo flights match these filters"
              description="Disable the Direct only or Refundable filters to inspect all simulated itineraries."
            />
          ) : (
            <div className="space-y-3">
              {filteredResults.map((flight) => (
                <div
                  key={flight.id}
                  className="p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <div>
                      <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {flight.airline}
                      </div>
                      <div className="text-[11px] font-mono-code mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {flight.flightNumber} · {flight.cabin} · Demo sample
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-sm font-bold font-mono-code">{flight.departureTime}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {flight.originCode}
                        </div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="text-[11px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                          {formatDuration(flight.durationMinutes)}
                        </div>
                        <div className="border-t my-1" style={{ borderColor: 'var(--border-strong)' }} />
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {flight.stops === 0 ? 'Direct' : `1 stop (${flight.stopCity})`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono-code">{flight.arrivalTime}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {flight.destinationCode}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                      <div>Baggage: {flight.baggage}</div>
                      <div>{flight.refundable ? 'Refundable (with fee)' : 'Non-refundable fare'}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Demo availability: {flight.seatsRemainingDemo} seats
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex sm:flex-row md:flex-col items-center md:items-end justify-between gap-2 pt-3 md:pt-0 border-t md:border-t-0 md:border-l md:pl-5 shrink-0"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="md:text-right">
                      <div className="text-base font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                        {formatMoneyFromUsd(flight.totalPriceUsd, currency)}
                      </div>
                      <div className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {formatMoneyFromUsd(flight.priceUsdPerAdult, currency)} / adult (demo)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCreateDraftBooking(flight)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-fg)',
                      }}
                    >
                      <Ticket className="w-3.5 h-3.5" aria-hidden="true" />
                      Create draft booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
