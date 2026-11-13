import type { NavItemConfig, NavSectionId } from '../types/crm';

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'overview', label: 'Overview', group: 'Operations' },
  { id: 'leads', label: 'Leads & CRM', group: 'Operations' },
  { id: 'calls', label: 'Phone calls', group: 'Operations' },
  { id: 'ticket-search', label: 'Ticket search', group: 'Operations' },
  { id: 'visitors', label: 'Website visitors', group: 'Website & Content' },
  { id: 'partners', label: 'Partner logos', group: 'Website & Content' },
  { id: 'offers', label: 'Website offers', group: 'Website & Content' },
  { id: 'testimonials', label: 'Testimonials', group: 'Website & Content' },
  { id: 'faqs', label: 'Website FAQs', group: 'Website & Content' },
  { id: 'telegram', label: 'Telegram inbox', group: 'Communication' },
  { id: 'subscribers', label: 'Subscribers', group: 'Communication' },
  { id: 'bookings', label: 'Booking records', group: 'Operations' },
  { id: 'saved-searches', label: 'Saved searches', group: 'Operations' },
  { id: 'team', label: 'Team access', group: 'Workspace' },
  { id: 'integrations', label: 'Integrations', group: 'Workspace' },
  { id: 'activity', label: 'Activity log', group: 'Workspace' },
  { id: 'account', label: 'My account', group: 'Workspace' },
];

export function getNavItem(id: NavSectionId): NavItemConfig {
  return NAV_ITEMS.find((n) => n.id === id) ?? NAV_ITEMS[0];
}
