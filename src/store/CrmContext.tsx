import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createSeedState } from '../data/seed';
import { isValidThemeId, THEME_STORAGE_KEY } from '../lib/themes';
import { hydrateStoredState } from '../lib/validation';
import { starAviaService } from '../services/apiClient';
import type {
  ActivityEntityType,
  ActivityLogEntry,
  Booking,
  CallRecord,
  CrmState,
  DemoFlightResult,
  FaqItem,
  FlightSearchParams,
  Lead,
  LeadStage,
  NavSectionId,
  PartnerLogo,
  SavedSearch,
  Subscriber,
  TeamRole,
  Testimonial,
  ThemeId,
  UserProfile,
  WebsiteOffer,
} from '../types/crm';

export interface ToastMessage {
  id: string;
  text: string;
  tone: 'success' | 'info' | 'warning';
}

interface CrmContextValue {
  state: CrmState;
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  activeSection: NavSectionId;
  navigate: (section: NavSectionId) => void;
  recoveredWarning: boolean;
  dismissRecoveredWarning: () => void;
  toasts: ToastMessage[];
  pushToast: (text: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (id: string) => void;

  // Cross-section workflows
  pendingLeadModalOpen: boolean;
  setPendingLeadModalOpen: (open: boolean) => void;
  pendingBookingModalOpen: boolean;
  setPendingBookingModalOpen: (open: boolean) => void;
  pendingDraftFlight: DemoFlightResult | null;
  setPendingDraftFlight: (flight: DemoFlightResult | null) => void;
  pendingSearchParams: FlightSearchParams | null;
  setPendingSearchParams: (params: FlightSearchParams | null) => void;

  // Leads
  createLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  changeLeadStage: (id: string, stage: LeadStage) => void;
  addLeadNote: (id: string, text: string) => void;
  deleteLead: (id: string) => void;

  // Bookings
  createBooking: (
    booking: Omit<Booking, 'id' | 'reference' | 'createdAt' | 'updatedAt'>
  ) => Booking;
  updateBooking: (id: string, patch: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;

  // Calls
  logCall: (call: Omit<CallRecord, 'id' | 'timestamp'>) => CallRecord;

  // Saved searches
  saveFlightSearch: (label: string, params: FlightSearchParams) => SavedSearch;
  deleteSavedSearch: (id: string) => void;

  // Partners
  upsertPartner: (partner: Omit<PartnerLogo, 'id'> & { id?: string }) => void;
  deletePartner: (id: string) => void;

  // Offers
  upsertOffer: (offer: Omit<WebsiteOffer, 'id' | 'updatedAt'> & { id?: string }) => void;
  deleteOffer: (id: string) => void;

  // Testimonials
  upsertTestimonial: (
    item: Omit<Testimonial, 'id' | 'createdAt'> & { id?: string }
  ) => void;
  deleteTestimonial: (id: string) => void;

  // FAQs
  upsertFaq: (faq: Omit<FaqItem, 'id'> & { id?: string }) => void;
  deleteFaq: (id: string) => void;
  moveFaqOrder: (id: string, direction: 'up' | 'down') => void;

  // Telegram
  markThreadRead: (id: string) => void;
  sendTelegramReply: (threadId: string, text: string) => void;

  // Subscribers
  addSubscriber: (sub: Omit<Subscriber, 'id' | 'subscribedAt'>) => void;
  deleteSubscriber: (id: string) => void;

  // Team
  updateTeamMemberRole: (id: string, role: TeamRole) => void;
  toggleTeamMemberActive: (id: string) => void;

  // Profile & notifications & reset
  updateProfile: (patch: Partial<UserProfile>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetDemoData: () => void;
}

const CrmContext = createContext<CrmContextValue | null>(null);

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function getInitialTheme(): ThemeId {
  try {
    const attr = document.documentElement.getAttribute('data-theme');
    if (isValidThemeId(attr)) return attr;
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isValidThemeId(saved)) return saved;
  } catch {
    // ignore
  }
  return 'emerald';
}

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [initialHydration] = useState(() =>
    hydrateStoredState(starAviaService.loadState(), createSeedState())
  );

  const [state, setState] = useState<CrmState>(initialHydration.state);
  const [recoveredWarning, setRecoveredWarning] = useState<boolean>(
    initialHydration.recoveredFromInvalid
  );
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);
  const [activeSection, setActiveSection] = useState<NavSectionId>('overview');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [pendingLeadModalOpen, setPendingLeadModalOpen] = useState(false);
  const [pendingBookingModalOpen, setPendingBookingModalOpen] = useState(false);
  const [pendingDraftFlight, setPendingDraftFlight] = useState<DemoFlightResult | null>(null);
  const [pendingSearchParams, setPendingSearchParams] = useState<FlightSearchParams | null>(null);

  useEffect(() => {
    starAviaService.saveState(state);
  }, [state]);

  const setTheme = useCallback((nextTheme: ThemeId) => {
    setThemeState(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (text: string, tone: ToastMessage['tone'] = 'success') => {
      const id = makeId('toast');
      setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const navigate = useCallback((section: NavSectionId) => {
    setActiveSection(section);
  }, []);

  const appendActivity = useCallback(
    (
      prev: CrmState,
      action: string,
      entityType: ActivityEntityType,
      entityLabel: string,
      details?: string
    ): ActivityLogEntry[] => {
      const entry: ActivityLogEntry = {
        id: makeId('act'),
        actor: prev.profile.fullName,
        action,
        entityType,
        entityLabel,
        details,
        timestamp: nowIso(),
      };
      return [entry, ...prev.activityLog].slice(0, 150);
    },
    []
  );

  const createLead: CrmContextValue['createLead'] = useCallback(
    (input) => {
      const created: Lead = {
        ...input,
        id: makeId('lead'),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        notes: [],
      };
      setState((prev) => ({
        ...prev,
        leads: [created, ...prev.leads],
        activityLog: appendActivity(
          prev,
          'Created lead',
          'Lead',
          `${created.fullName} (${created.originCode} → ${created.destinationCode})`,
          `Stage: ${created.stage} · Source: ${created.source}`
        ),
      }));
      pushToast(`Lead "${created.fullName}" added to ${created.stage}.`);
      return created;
    },
    [appendActivity, pushToast]
  );

  const updateLead: CrmContextValue['updateLead'] = useCallback(
    (id, patch) => {
      setState((prev) => {
        const target = prev.leads.find((l) => l.id === id);
        if (!target) return prev;
        const updated = { ...target, ...patch, updatedAt: nowIso() };
        return {
          ...prev,
          leads: prev.leads.map((l) => (l.id === id ? updated : l)),
          activityLog: appendActivity(
            prev,
            'Updated lead',
            'Lead',
            `${updated.fullName} (${updated.originCode} → ${updated.destinationCode})`,
            patch.stage && patch.stage !== target.stage
              ? `Moved stage ${target.stage} → ${patch.stage}`
              : 'Updated lead details'
          ),
        };
      });
      pushToast('Lead record updated.');
    },
    [appendActivity, pushToast]
  );

  const changeLeadStage: CrmContextValue['changeLeadStage'] = useCallback(
    (id, stage) => {
      setState((prev) => {
        const target = prev.leads.find((l) => l.id === id);
        if (!target || target.stage === stage) return prev;
        const updated = { ...target, stage, updatedAt: nowIso() };
        return {
          ...prev,
          leads: prev.leads.map((l) => (l.id === id ? updated : l)),
          activityLog: appendActivity(
            prev,
            'Changed lead stage',
            'Lead',
            `${updated.fullName} (${updated.originCode} → ${updated.destinationCode})`,
            `${target.stage} → ${stage}`
          ),
        };
      });
      pushToast(`Lead moved to ${stage}.`);
    },
    [appendActivity, pushToast]
  );

  const addLeadNote: CrmContextValue['addLeadNote'] = useCallback(
    (id, text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setState((prev) => {
        const target = prev.leads.find((l) => l.id === id);
        if (!target) return prev;
        const note = {
          id: makeId('ln'),
          author: prev.profile.fullName,
          text: trimmed,
          createdAt: nowIso(),
        };
        const updated: Lead = {
          ...target,
          notes: [note, ...target.notes],
          updatedAt: nowIso(),
        };
        return {
          ...prev,
          leads: prev.leads.map((l) => (l.id === id ? updated : l)),
          activityLog: appendActivity(
            prev,
            'Added lead note',
            'Lead',
            updated.fullName,
            trimmed.slice(0, 90)
          ),
        };
      });
      pushToast('Note saved to lead timeline.');
    },
    [appendActivity, pushToast]
  );

  const deleteLead: CrmContextValue['deleteLead'] = useCallback(
    (id) => {
      setState((prev) => {
        const target = prev.leads.find((l) => l.id === id);
        if (!target) return prev;
        return {
          ...prev,
          leads: prev.leads.filter((l) => l.id !== id),
          activityLog: appendActivity(
            prev,
            'Deleted lead',
            'Lead',
            `${target.fullName} (${target.originCode} → ${target.destinationCode})`
          ),
        };
      });
      pushToast('Lead deleted.', 'info');
    },
    [appendActivity, pushToast]
  );

  const createBooking: CrmContextValue['createBooking'] = useCallback(
    (input) => {
      const refNum = Math.floor(8900 + Math.random() * 1000);
      const created: Booking = {
        ...input,
        id: makeId('bk'),
        reference: `SAV-2026-${refNum}`,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setState((prev) => ({
        ...prev,
        bookings: [created, ...prev.bookings],
        activityLog: appendActivity(
          prev,
          'Created booking',
          'Booking',
          `${created.reference} · ${created.clientName}`,
          `${created.originCode} → ${created.destinationCode} · ${created.bookingStatus}`
        ),
      }));
      pushToast(`Booking ${created.reference} created (${created.bookingStatus}).`);
      return created;
    },
    [appendActivity, pushToast]
  );

  const updateBooking: CrmContextValue['updateBooking'] = useCallback(
    (id, patch) => {
      setState((prev) => {
        const target = prev.bookings.find((b) => b.id === id);
        if (!target) return prev;
        const updated = { ...target, ...patch, updatedAt: nowIso() };
        return {
          ...prev,
          bookings: prev.bookings.map((b) => (b.id === id ? updated : b)),
          activityLog: appendActivity(
            prev,
            'Updated booking',
            'Booking',
            `${updated.reference} · ${updated.clientName}`,
            `Status: ${updated.bookingStatus} · Payment: ${updated.paymentStatus}`
          ),
        };
      });
      pushToast('Booking record updated.');
    },
    [appendActivity, pushToast]
  );

  const deleteBooking: CrmContextValue['deleteBooking'] = useCallback(
    (id) => {
      setState((prev) => {
        const target = prev.bookings.find((b) => b.id === id);
        if (!target) return prev;
        return {
          ...prev,
          bookings: prev.bookings.filter((b) => b.id !== id),
          activityLog: appendActivity(
            prev,
            'Deleted booking',
            'Booking',
            `${target.reference} · ${target.clientName}`
          ),
        };
      });
      pushToast('Booking deleted.', 'info');
    },
    [appendActivity, pushToast]
  );

  const logCall: CrmContextValue['logCall'] = useCallback(
    (input) => {
      const record: CallRecord = {
        ...input,
        id: makeId('call'),
        timestamp: nowIso(),
      };
      setState((prev) => ({
        ...prev,
        calls: [record, ...prev.calls],
        activityLog: appendActivity(
          prev,
          'Logged simulated call',
          'Call',
          `${record.contactName} (${record.phoneNumber})`,
          `${record.direction} · ${record.outcome}`
        ),
      }));
      pushToast(`Simulated ${record.direction.toLowerCase()} call logged.`);
      return record;
    },
    [appendActivity, pushToast]
  );

  const saveFlightSearch: CrmContextValue['saveFlightSearch'] = useCallback(
    (label, params) => {
      const item: SavedSearch = {
        id: makeId('ss'),
        label: label.trim() || `${params.originCode} → ${params.destinationCode}`,
        params,
        createdBy: state.profile.fullName,
        createdAt: nowIso(),
      };
      setState((prev) => ({
        ...prev,
        savedSearches: [item, ...prev.savedSearches],
        activityLog: appendActivity(
          prev,
          'Saved flight search',
          'Saved Search',
          item.label,
          `${params.originCode} → ${params.destinationCode} · ${params.cabin}`
        ),
      }));
      pushToast(`Saved search "${item.label}".`);
      return item;
    },
    [appendActivity, pushToast, state.profile.fullName]
  );

  const deleteSavedSearch: CrmContextValue['deleteSavedSearch'] = useCallback(
    (id) => {
      setState((prev) => {
        const target = prev.savedSearches.find((s) => s.id === id);
        if (!target) return prev;
        return {
          ...prev,
          savedSearches: prev.savedSearches.filter((s) => s.id !== id),
          activityLog: appendActivity(prev, 'Deleted saved search', 'Saved Search', target.label),
        };
      });
      pushToast('Saved search removed.', 'info');
    },
    [appendActivity, pushToast]
  );

  const upsertPartner: CrmContextValue['upsertPartner'] = useCallback(
    (partner) => {
      setState((prev) => {
        const exists = partner.id && prev.partners.some((p) => p.id === partner.id);
        const item: PartnerLogo = exists
          ? ({ ...prev.partners.find((p) => p.id === partner.id)!, ...partner } as PartnerLogo)
          : { ...partner, id: makeId('pt') };
        const partners = exists
          ? prev.partners.map((p) => (p.id === item.id ? item : p))
          : [...prev.partners, item];
        return {
          ...prev,
          partners: partners.sort((a, b) => a.displayOrder - b.displayOrder),
          activityLog: appendActivity(
            prev,
            exists ? 'Updated partner' : 'Added partner',
            'Partner',
            item.name,
            item.published ? 'Published' : 'Hidden'
          ),
        };
      });
      pushToast(partner.id ? 'Partner updated.' : 'Partner added.');
    },
    [appendActivity, pushToast]
  );

  const deletePartner: CrmContextValue['deletePartner'] = useCallback(
    (id) => {
      setState((prev) => {
        const target = prev.partners.find((p) => p.id === id);
        if (!target) return prev;
        return {
          ...prev,
          partners: prev.partners.filter((p) => p.id !== id),
          activityLog: appendActivity(prev, 'Deleted partner', 'Partner', target.name),
        };
      });
      pushToast('Partner removed.', 'info');
    },
    [appendActivity, pushToast]
  );

  const upsertOffer: CrmContextValue['upsertOffer'] = useCallback(
    (offer) => {
      setState((prev) => {
        const exists = offer.id && prev.offers.some((o) => o.id === offer.id);
        const item: WebsiteOffer = {
          ...offer,
          id: offer.id ?? makeId('of'),
          updatedAt: nowIso(),
        };
        const offers = exists
          ? prev.offers.map((o) => (o.id === item.id ? item : o))
          : [item, ...prev.offers];
        return {
          ...prev,
          offers,
          activityLog: appendActivity(
            prev,
            exists ? 'Updated offer' : 'Created offer',
            'Offer',
            item.title,
            `${item.destination} · ${item.status}`
          ),
        };
      });
      pushToast(offer.id ? 'Website offer updated.' : 'Website offer created.');
    },
    [appendActivity, pushToast]
  );

  const deleteOffer: CrmContextValue['deleteOffer'] = useCallback(
    (id) => {
      setState((prev) => {
        const target = prev.offers.find((o) => o.id === id);
        if (!target) return prev;
        return {
          ...prev,
          offers: prev.offers.filter((o) => o.id !== id),
          activityLog: appendActivity(prev, 'Deleted offer', 'Offer', target.title),
        };
      });
      pushToast('Offer deleted.', 'info');
    },
    [appendActivity, pushToast]
  );

  const upsertTestimonial: CrmContextValue['upsertTestimonial'] = useCallback(
    (item) => {
      setState((prev) => {
        const existing = item.id ? prev.testimonials.find((t) => t.id === item.id) : undefined;
        const next: Testimonial = existing
          ? { ...existing, ...item }
          : { ...item, id: makeId('ts'), createdAt: nowIso() };
        const testimonials = existing
          ? prev.testimonials.map((t) => (t.id === next.id ? next : t))
          : [next, ...prev.testimonials];
        return {
          ...prev,
          testimonials,
          activityLog: appendActivity(
            prev,
            existing ? 'Updated testimonial' : 'Added testimonial',
            'Testimonial',
            next.customerName,
            `${next.rating}/5 · ${next.published ? 'Published' : 'Draft'}`
          ),
        };
      });
      pushToast(item.id ? 'Testimonial updated.' : 'Testimonial added.');
    },
    [appendActivity, pushToast]
  );

  const deleteTestimonial: CrmContextValue['deleteTestimonial'] = useCallback(
    (id) => {
      setState((prev) => {
        const target = prev.testimonials.find((t) => t.id === id);
        if (!target) return prev;
        return {
          ...prev,
          testimonials: prev.testimonials.filter((t) => t.id !== id),
          activityLog: appendActivity(prev, 'Deleted testimonial', 'Testimonial', target.customerName),
        };
      });
      pushToast('Testimonial removed.', 'info');
    },
    [appendActivity, pushToast]
  );

  const upsertFaq: CrmContextValue['upsertFaq'] = useCallback(
    (faq) => {
      setState((prev) => {
        const exists = faq.id && prev.faqs.some((f) => f.id === faq.id);
        const item: FaqItem = { ...faq, id: faq.id ?? makeId('faq') };
        const faqs = exists
          ? prev.faqs.map((f) => (f.id === item.id ? item : f))
          : [...prev.faqs, item];
        return {
          ...prev,
          faqs: faqs.sort((a, b) => a.displayOrder - b.displayOrder),
          activityLog: appendActivity(
            prev,
            exists ? 'Updated FAQ' : 'Created FAQ',
            'FAQ',
            item.question.slice(0, 60),
            item.published ? 'Published' : 'Draft'
          ),
        };
      });
      pushToast(faq.id ? 'FAQ updated.' : 'FAQ added.');
    },
    [appendActivity, pushToast]
  );

  const deleteFaq: CrmContextValue['deleteFaq'] = useCallback(
    (id) => {
      setState((prev) => {
        const target = prev.faqs.find((f) => f.id === id);
        if (!target) return prev;
        return {
          ...prev,
          faqs: prev.faqs.filter((f) => f.id !== id),
          activityLog: appendActivity(prev, 'Deleted FAQ', 'FAQ', target.question.slice(0, 60)),
        };
      });
      pushToast('FAQ deleted.', 'info');
    },
    [appendActivity, pushToast]
  );

  const moveFaqOrder: CrmContextValue['moveFaqOrder'] = useCallback(
    (id, direction) => {
      setState((prev) => {
        const ordered = [...prev.faqs].sort((a, b) => a.displayOrder - b.displayOrder);
        const idx = ordered.findIndex((f) => f.id === id);
        if (idx === -1) return prev;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= ordered.length) return prev;
        const copy = [...ordered];
        const temp = copy[idx];
        copy[idx] = copy[swapIdx];
        copy[swapIdx] = temp;
        const reindexed = copy.map((item, i) => ({ ...item, displayOrder: i + 1 }));
        return {
          ...prev,
          faqs: reindexed,
          activityLog: appendActivity(
            prev,
            'Reordered FAQ',
            'FAQ',
            ordered[idx].question.slice(0, 50),
            `Moved ${direction} to #${swapIdx + 1}`
          ),
        };
      });
    },
    [appendActivity]
  );

  const markThreadRead: CrmContextValue['markThreadRead'] = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      telegramThreads: prev.telegramThreads.map((t) =>
        t.id === id ? { ...t, unreadCount: 0 } : t
      ),
    }));
  }, []);

  const sendTelegramReply: CrmContextValue['sendTelegramReply'] = useCallback(
    (threadId, text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setState((prev) => {
        const target = prev.telegramThreads.find((t) => t.id === threadId);
        if (!target) return prev;
        const msg = {
          id: makeId('tgm'),
          sender: 'agent' as const,
          senderName: prev.profile.fullName,
          text: trimmed,
          timestamp: nowIso(),
        };
        return {
          ...prev,
          telegramThreads: prev.telegramThreads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  unreadCount: 0,
                  lastMessageAt: msg.timestamp,
                  messages: [...t.messages, msg],
                }
              : t
          ),
          activityLog: appendActivity(
            prev,
            'Sent simulated Telegram reply',
            'Telegram',
            target.customerName,
            trimmed.slice(0, 80)
          ),
        };
      });
      pushToast('Simulated Telegram reply recorded locally.');
    },
    [appendActivity, pushToast]
  );

  const addSubscriber: CrmContextValue['addSubscriber'] = useCallback(
    (sub) => {
      const item: Subscriber = {
        ...sub,
        id: makeId('sub'),
        email: sub.email.trim().toLowerCase(),
        subscribedAt: new Date().toISOString().slice(0, 10),
      };
      setState((prev) => ({
        ...prev,
        subscribers: [item, ...prev.subscribers],
        activityLog: appendActivity(
          prev,
          'Added subscriber',
          'Subscriber',
          item.email,
          `Source: ${item.source}`
        ),
      }));
      pushToast(`Subscriber "${item.email}" added.`);
    },
    [appendActivity, pushToast]
  );

  const deleteSubscriber: CrmContextValue['deleteSubscriber'] = useCallback(
    (id) => {
      setState((prev) => {
        const target = prev.subscribers.find((s) => s.id === id);
        if (!target) return prev;
        return {
          ...prev,
          subscribers: prev.subscribers.filter((s) => s.id !== id),
          activityLog: appendActivity(prev, 'Removed subscriber', 'Subscriber', target.email),
        };
      });
      pushToast('Subscriber removed.', 'info');
    },
    [appendActivity, pushToast]
  );

  const updateTeamMemberRole: CrmContextValue['updateTeamMemberRole'] = useCallback(
    (id, role) => {
      setState((prev) => {
        const target = prev.teamMembers.find((m) => m.id === id);
        if (!target || target.role === role) return prev;
        return {
          ...prev,
          teamMembers: prev.teamMembers.map((m) => (m.id === id ? { ...m, role } : m)),
          activityLog: appendActivity(
            prev,
            'Updated demo team role',
            'Team',
            target.fullName,
            `${target.role} → ${role} (demo only)`
          ),
        };
      });
      pushToast(`Demo role updated to ${role}.`);
    },
    [appendActivity, pushToast]
  );

  const toggleTeamMemberActive: CrmContextValue['toggleTeamMemberActive'] = useCallback(
    (id) => {
      setState((prev) => {
        const target = prev.teamMembers.find((m) => m.id === id);
        if (!target) return prev;
        const nextActive = !target.active;
        return {
          ...prev,
          teamMembers: prev.teamMembers.map((m) =>
            m.id === id ? { ...m, active: nextActive } : m
          ),
          activityLog: appendActivity(
            prev,
            nextActive ? 'Enabled demo team member' : 'Paused demo team member',
            'Team',
            target.fullName
          ),
        };
      });
    },
    [appendActivity]
  );

  const updateProfile: CrmContextValue['updateProfile'] = useCallback(
    (patch) => {
      setState((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...patch },
        activityLog: appendActivity(
          prev,
          'Updated account preferences',
          'Account',
          patch.fullName ?? prev.profile.fullName
        ),
      }));
      pushToast('Account preferences saved.');
    },
    [appendActivity, pushToast]
  );

  const markNotificationRead: CrmContextValue['markNotificationRead'] = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead: CrmContextValue['markAllNotificationsRead'] = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    starAviaService.clearState();
    const fresh = createSeedState();
    setState(fresh);
    setRecoveredWarning(false);
    pushToast('Demo workspace reset to initial sample records.', 'info');
  }, [pushToast]);

  return (
    <CrmContext.Provider
      value={{
        state,
        theme,
        setTheme,
        activeSection,
        navigate,
        recoveredWarning,
        dismissRecoveredWarning: () => setRecoveredWarning(false),
        toasts,
        pushToast,
        dismissToast,
        pendingLeadModalOpen,
        setPendingLeadModalOpen,
        pendingBookingModalOpen,
        setPendingBookingModalOpen,
        pendingDraftFlight,
        setPendingDraftFlight,
        pendingSearchParams,
        setPendingSearchParams,
        createLead,
        updateLead,
        changeLeadStage,
        addLeadNote,
        deleteLead,
        createBooking,
        updateBooking,
        deleteBooking,
        logCall,
        saveFlightSearch,
        deleteSavedSearch,
        upsertPartner,
        deletePartner,
        upsertOffer,
        deleteOffer,
        upsertTestimonial,
        deleteTestimonial,
        upsertFaq,
        deleteFaq,
        moveFaqOrder,
        markThreadRead,
        sendTelegramReply,
        addSubscriber,
        deleteSubscriber,
        updateTeamMemberRole,
        toggleTeamMemberActive,
        updateProfile,
        markNotificationRead,
        markAllNotificationsRead,
        resetDemoData,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm must be used inside CrmProvider');
  return ctx;
}
