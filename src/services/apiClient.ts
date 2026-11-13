import type { CrmState } from '../types/crm';

export const CRM_STORAGE_KEY = 'staraviatravel_crm_demo_v1';

export interface StarAviaServiceBoundary {
  readonly mode: 'demo-local';
  readonly djangoEndpoints: {
    leads: string;
    bookings: string;
    calls: string;
    flightSearch: string;
    offers: string;
    partners: string;
    testimonials: string;
    faqs: string;
    subscribers: string;
    team: string;
    activity: string;
    account: string;
  };
  loadState(): string | null;
  saveState(state: CrmState): void;
  clearState(): void;
}

/**
 * Service boundary preserving clean separation between the React UI and
 * future Django REST API endpoints. Currently backed by browser localStorage
 * for the interactive demo workspace without storing API secrets or PII documents.
 */
export const starAviaService: StarAviaServiceBoundary = {
  mode: 'demo-local',
  djangoEndpoints: {
    leads: '/api/v1/crm/leads/',
    bookings: '/api/v1/bookings/records/',
    calls: '/api/v1/telephony/calls/',
    flightSearch: '/api/v1/flights/search/',
    offers: '/api/v1/cms/offers/',
    partners: '/api/v1/cms/partners/',
    testimonials: '/api/v1/cms/testimonials/',
    faqs: '/api/v1/cms/faqs/',
    subscribers: '/api/v1/marketing/subscribers/',
    team: '/api/v1/iam/team/',
    activity: '/api/v1/audit/activity/',
    account: '/api/v1/account/me/',
  },
  loadState() {
    try {
      return window.localStorage.getItem(CRM_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  saveState(state: CrmState) {
    try {
      window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota issues cleanly in demo mode
    }
  },
  clearState() {
    try {
      window.localStorage.removeItem(CRM_STORAGE_KEY);
    } catch {
      // Ignore storage errors cleanly
    }
  },
};
