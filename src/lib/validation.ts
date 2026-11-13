import type {
  Booking,
  CrmState,
  FlightSearchParams,
  Passenger,
  Subscriber,
} from '../types/crm';
import { findAirportByCode } from '../data/airports';

export const CRM_SCHEMA_VERSION = 1;

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function validateSubscriberInput(
  email: string,
  existing: Subscriber[]
): ValidationResult {
  const errors: Record<string, string> = {};
  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(normalized)) {
    errors.email = 'Please enter a valid email address.';
  } else if (existing.some((s) => s.email.trim().toLowerCase() === normalized)) {
    errors.email = 'This email is already subscribed.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateFlightSearch(params: FlightSearchParams): ValidationResult {
  const errors: Record<string, string> = {};
  const origin = findAirportByCode(params.originCode);
  const dest = findAirportByCode(params.destinationCode);

  if (!origin) {
    errors.originCode = 'Select a valid departure airport from the list.';
  }
  if (!dest) {
    errors.destinationCode = 'Select a valid arrival airport from the list.';
  }
  if (origin && dest && origin.code === dest.code) {
    errors.destinationCode = 'Arrival airport must be different from departure airport.';
  }
  if (!params.departureDate) {
    errors.departureDate = 'Departure date is required.';
  }
  if (params.tripType === 'round-trip') {
    if (!params.returnDate) {
      errors.returnDate = 'Return date is required for round-trip searches.';
    } else if (params.departureDate && params.returnDate < params.departureDate) {
      errors.returnDate = 'Return date cannot be earlier than departure date.';
    }
  }
  if (params.adults < 1 || params.adults > 9) {
    errors.adults = 'At least 1 adult passenger is required (max 9).';
  }
  if (params.infants > params.adults) {
    errors.infants = 'Number of infants cannot exceed adult passengers.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateBookingInput(input: {
  clientName: string;
  clientEmail: string;
  originCode: string;
  destinationCode: string;
  departureDate: string;
  returnDate?: string;
  airline: string;
  flightNumber: string;
  totalAmountUsd: number;
  paidAmountUsd: number;
  passengers: Passenger[];
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.clientName.trim()) {
    errors.clientName = 'Client full name is required.';
  }
  if (!input.clientEmail.trim() || !isValidEmail(input.clientEmail)) {
    errors.clientEmail = 'Valid client email is required.';
  }
  if (!findAirportByCode(input.originCode)) {
    errors.originCode = 'Valid 3-letter origin airport code is required.';
  }
  if (!findAirportByCode(input.destinationCode)) {
    errors.destinationCode = 'Valid 3-letter destination airport code is required.';
  }
  if (
    input.originCode &&
    input.destinationCode &&
    input.originCode.trim().toUpperCase() === input.destinationCode.trim().toUpperCase()
  ) {
    errors.destinationCode = 'Destination must differ from origin.';
  }
  if (!input.departureDate) {
    errors.departureDate = 'Departure date is required.';
  }
  if (input.returnDate && input.departureDate && input.returnDate < input.departureDate) {
    errors.returnDate = 'Return date cannot be before departure date.';
  }
  if (!input.airline.trim()) {
    errors.airline = 'Airline name is required.';
  }
  if (!input.flightNumber.trim()) {
    errors.flightNumber = 'Flight number is required.';
  }
  if (!Number.isFinite(input.totalAmountUsd) || input.totalAmountUsd <= 0) {
    errors.totalAmountUsd = 'Booking amount must be greater than zero.';
  }
  if (!Number.isFinite(input.paidAmountUsd) || input.paidAmountUsd < 0) {
    errors.paidAmountUsd = 'Collected payment cannot be negative.';
  } else if (input.paidAmountUsd > input.totalAmountUsd) {
    errors.paidAmountUsd = 'Collected payment cannot exceed total booking amount.';
  }

  if (!Array.isArray(input.passengers) || input.passengers.length === 0) {
    errors.passengers = 'At least one passenger is required.';
  } else {
    const emptyPassenger = input.passengers.some((p) => !p.fullName.trim());
    if (emptyPassenger) {
      errors.passengers = 'Every passenger must have a full name.';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function hydrateStoredState(
  rawJson: string | null,
  fallbackSeed: CrmState
): { state: CrmState; recoveredFromInvalid: boolean } {
  if (!rawJson) {
    return { state: fallbackSeed, recoveredFromInvalid: false };
  }
  try {
    const parsed = JSON.parse(rawJson) as Partial<CrmState>;
    if (!parsed || typeof parsed !== 'object') {
      return { state: fallbackSeed, recoveredFromInvalid: true };
    }
    if (
      parsed.schemaVersion !== CRM_SCHEMA_VERSION ||
      !Array.isArray(parsed.leads) ||
      !Array.isArray(parsed.bookings) ||
      !parsed.profile
    ) {
      return { state: fallbackSeed, recoveredFromInvalid: true };
    }

    const hydrated: CrmState = {
      ...fallbackSeed,
      ...parsed,
      profile: {
        ...fallbackSeed.profile,
        ...parsed.profile,
      },
      visitors: parsed.visitors ?? fallbackSeed.visitors,
      leads: parsed.leads,
      bookings: parsed.bookings,
      calls: Array.isArray(parsed.calls) ? parsed.calls : fallbackSeed.calls,
      savedSearches: Array.isArray(parsed.savedSearches)
        ? parsed.savedSearches
        : fallbackSeed.savedSearches,
      partners: Array.isArray(parsed.partners) ? parsed.partners : fallbackSeed.partners,
      offers: Array.isArray(parsed.offers) ? parsed.offers : fallbackSeed.offers,
      testimonials: Array.isArray(parsed.testimonials)
        ? parsed.testimonials
        : fallbackSeed.testimonials,
      faqs: Array.isArray(parsed.faqs) ? parsed.faqs : fallbackSeed.faqs,
      telegramThreads: Array.isArray(parsed.telegramThreads)
        ? parsed.telegramThreads
        : fallbackSeed.telegramThreads,
      subscribers: Array.isArray(parsed.subscribers)
        ? parsed.subscribers
        : fallbackSeed.subscribers,
      teamMembers: Array.isArray(parsed.teamMembers)
        ? parsed.teamMembers
        : fallbackSeed.teamMembers,
      integrations: Array.isArray(parsed.integrations)
        ? parsed.integrations
        : fallbackSeed.integrations,
      activityLog: Array.isArray(parsed.activityLog)
        ? parsed.activityLog
        : fallbackSeed.activityLog,
      notifications: Array.isArray(parsed.notifications)
        ? parsed.notifications
        : fallbackSeed.notifications,
    };

    return { state: hydrated, recoveredFromInvalid: false };
  } catch {
    return { state: fallbackSeed, recoveredFromInvalid: true };
  }
}

export function derivePaymentStatusFromAmounts(
  totalAmountUsd: number,
  paidAmountUsd: number,
  currentStatus: Booking['paymentStatus']
): Booking['paymentStatus'] {
  if (currentStatus === 'Refunded') return 'Refunded';
  if (paidAmountUsd <= 0) return 'Unpaid';
  if (paidAmountUsd >= totalAmountUsd) return 'Paid';
  return 'Partially Paid';
}
