import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCsvContent, sanitizeCsvCell } from './csv';
import { convertFromUsd, formatMoneyFromUsd } from './currency';
import {
  computeLeadSources,
  computeOverviewMetrics,
  computeRevenueTrend,
  generateDemoFlightResults,
  getUpcomingDepartures,
} from './metrics';
import {
  derivePaymentStatusFromAmounts,
  hydrateStoredState,
  validateBookingInput,
  validateFlightSearch,
  validateSubscriberInput,
} from './validation';
import { createSeedState } from '../data/seed';

test('CSV cell sanitizer escapes quotes and blocks spreadsheet formula injection', () => {
  assert.equal(sanitizeCsvCell('=CMD("calc")'), `"'=CMD(""calc"")"`);
  assert.equal(sanitizeCsvCell('+123456'), "'+123456");
  assert.equal(sanitizeCsvCell('-SUM(A1:A2)'), "'-SUM(A1:A2)");
  assert.equal(sanitizeCsvCell('@malicious'), "'@malicious");
  assert.equal(sanitizeCsvCell('  =1+1'), "'  =1+1");
  assert.equal(sanitizeCsvCell('Hello, "World"'), '"Hello, ""World"""');

  const csv = buildCsvContent(['Email', 'Name'], [['test@example.com', '=HYPERLINK("x")']]);
  assert.equal(csv, 'Email,Name\r\ntest@example.com,"\'=HYPERLINK(""x"")"');
});

test('Currency conversion and formatting work for all supported currencies', () => {
  assert.equal(convertFromUsd(100, 'USD'), 100);
  assert.equal(convertFromUsd(100, 'EUR'), 92);
  assert.equal(formatMoneyFromUsd(1250, 'USD'), '$1,250');
  assert.equal(formatMoneyFromUsd(1000, 'UZS'), 'UZS 12,800,000');
});

test('Subscriber validation rejects invalid and duplicate emails', () => {
  const seed = createSeedState();
  const dup = validateSubscriberInput('FARRUkh.sadikov@example.com', seed.subscribers);
  assert.equal(dup.valid, false);
  assert.ok(dup.errors.email.includes('already subscribed'));

  const bad = validateSubscriberInput('not-an-email', seed.subscribers);
  assert.equal(bad.valid, false);

  const ok = validateSubscriberInput('new.traveler@example.com', seed.subscribers);
  assert.equal(ok.valid, true);
});

test('Flight search validation checks airports, dates, and infant limits', () => {
  const sameAirport = validateFlightSearch({
    tripType: 'one-way',
    originCode: 'TAS',
    destinationCode: 'TAS',
    departureDate: '2026-12-01',
    returnDate: '',
    adults: 1,
    children: 0,
    infants: 0,
    cabin: 'Economy',
  });
  assert.equal(sameAirport.valid, false);
  assert.ok(sameAirport.errors.destinationCode);

  const badReturn = validateFlightSearch({
    tripType: 'round-trip',
    originCode: 'TAS',
    destinationCode: 'IST',
    departureDate: '2026-12-10',
    returnDate: '2026-12-05',
    adults: 1,
    children: 0,
    infants: 2,
    cabin: 'Business',
  });
  assert.equal(badReturn.valid, false);
  assert.ok(badReturn.errors.returnDate);
  assert.ok(badReturn.errors.infants);

  const valid = validateFlightSearch({
    tripType: 'round-trip',
    originCode: 'TAS',
    destinationCode: 'IST',
    departureDate: '2026-12-05',
    returnDate: '2026-12-12',
    adults: 2,
    children: 1,
    infants: 0,
    cabin: 'Economy',
  });
  assert.equal(valid.valid, true);
  const flights = generateDemoFlightResults({
    tripType: 'round-trip',
    originCode: 'TAS',
    destinationCode: 'IST',
    departureDate: '2026-12-05',
    returnDate: '2026-12-12',
    adults: 2,
    children: 1,
    infants: 0,
    cabin: 'Economy',
  });
  assert.ok(flights.length >= 4);
  assert.ok(flights.every((f) => f.originCode === 'TAS' && f.destinationCode === 'IST'));
});

test('Booking validation enforces paid <= total and valid passengers', () => {
  const invalid = validateBookingInput({
    clientName: 'Test Client',
    clientEmail: 'client@example.com',
    originCode: 'TAS',
    destinationCode: 'DXB',
    departureDate: '2026-12-01',
    airline: 'flydubai',
    flightNumber: 'FZ 1944',
    totalAmountUsd: 1000,
    paidAmountUsd: 1200,
    passengers: [{ id: '1', fullName: '', type: 'Adult', nationality: 'UZ' }],
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.paidAmountUsd);
  assert.ok(invalid.errors.passengers);

  assert.equal(derivePaymentStatusFromAmounts(1000, 0, 'Unpaid'), 'Unpaid');
  assert.equal(derivePaymentStatusFromAmounts(1000, 400, 'Unpaid'), 'Partially Paid');
  assert.equal(derivePaymentStatusFromAmounts(1000, 1000, 'Partially Paid'), 'Paid');
});

test('Metrics derive booking value, collected payments, trends, and departures consistently', () => {
  const seed = createSeedState();
  const metricsAll = computeOverviewMetrics(seed.bookings, seed.leads, 'all', '2026-11-13');
  const expectedGross = seed.bookings.reduce((s, b) => s + b.totalAmountUsd, 0);
  const expectedCollected = seed.bookings.reduce((s, b) => s + b.paidAmountUsd, 0);
  assert.equal(metricsAll.grossBookingValueUsd, expectedGross);
  assert.equal(metricsAll.collectedPaymentsUsd, expectedCollected);
  assert.equal(metricsAll.totalBookings, seed.bookings.length);

  const trend = computeRevenueTrend(seed.bookings, 'all', '2026-11-13');
  assert.ok(trend.length >= 3);
  const trendSum = trend.reduce((s, t) => s + t.bookingValueUsd, 0);
  assert.equal(trendSum, expectedGross);

  const sources = computeLeadSources(seed.leads, 'all', '2026-11-13');
  assert.equal(
    sources.reduce((s, d) => s + d.count, 0),
    seed.leads.length
  );

  const departures = getUpcomingDepartures(seed.bookings, '2026-11-13', 5);
  assert.ok(departures.length > 0);
  assert.ok(departures.every((b) => b.departureDate >= '2026-11-13'));
});

test('Storage hydration recovers gracefully from corrupted or outdated payloads', () => {
  const seed = createSeedState();
  const broken = hydrateStoredState('{bad json', seed);
  assert.equal(broken.recoveredFromInvalid, true);
  assert.equal(broken.state.bookings.length, seed.bookings.length);

  const outdated = hydrateStoredState(JSON.stringify({ schemaVersion: 0, leads: [] }), seed);
  assert.equal(outdated.recoveredFromInvalid, true);

  const valid = hydrateStoredState(JSON.stringify(seed), seed);
  assert.equal(valid.recoveredFromInvalid, false);
  assert.equal(valid.state.leads.length, seed.leads.length);
});
