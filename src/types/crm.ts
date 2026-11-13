export type ThemeId = 'emerald' | 'ivory-gold' | 'graphite' | 'ocean' | 'lavender';

export type CurrencyCode = 'USD' | 'EUR' | 'UZS' | 'AED' | 'GBP';

export type NavSectionId =
  | 'overview'
  | 'leads'
  | 'calls'
  | 'ticket-search'
  | 'visitors'
  | 'partners'
  | 'offers'
  | 'testimonials'
  | 'faqs'
  | 'telegram'
  | 'subscribers'
  | 'bookings'
  | 'saved-searches'
  | 'team'
  | 'integrations'
  | 'activity'
  | 'account';

export interface NavItemConfig {
  id: NavSectionId;
  label: string;
  group: 'Operations' | 'Website & Content' | 'Communication' | 'Workspace';
}

export type LeadStage = 'New' | 'Contacted' | 'Quoted' | 'Negotiation' | 'Won' | 'Lost';

export type LeadSource =
  | 'Website Form'
  | 'Telegram'
  | 'Phone Call'
  | 'Referral'
  | 'Corporate'
  | 'Instagram';

export interface LeadNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  destination: string;
  originCode: string;
  destinationCode: string;
  travelDate: string;
  budgetUsd: number;
  source: LeadSource;
  stage: LeadStage;
  assignedAgent: string;
  createdAt: string;
  updatedAt: string;
  notes: LeadNote[];
}

export type BookingStatus = 'Draft' | 'Confirmed' | 'Pending Ticket' | 'Ticketed' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Refunded';
export type CabinClass = 'Economy' | 'Premium Economy' | 'Business' | 'First';

export interface Passenger {
  id: string;
  fullName: string;
  type: 'Adult' | 'Child' | 'Infant';
  nationality: string;
  seatPreference?: string;
}

export interface Booking {
  id: string;
  reference: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  originCode: string;
  destinationCode: string;
  originCity: string;
  destinationCity: string;
  airline: string;
  flightNumber: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  returnDate?: string;
  cabin: CabinClass;
  passengers: Passenger[];
  assignedAgent: string;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmountUsd: number;
  paidAmountUsd: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CallDirection = 'Incoming' | 'Outgoing' | 'Missed';
export type CallOutcome =
  | 'Quoted itinerary'
  | 'Booked follow-up'
  | 'No answer'
  | 'Left voicemail'
  | 'General inquiry'
  | 'Schedule change';

export interface CallRecord {
  id: string;
  contactName: string;
  phoneNumber: string;
  direction: CallDirection;
  durationSeconds: number;
  outcome: CallOutcome;
  agentName: string;
  timestamp: string;
  notes: string;
  relatedLeadId?: string;
}

export interface Airport {
  code: string;
  city: string;
  country: string;
  name: string;
  timezone: string;
}

export type TripType = 'one-way' | 'round-trip';

export interface FlightSearchParams {
  tripType: TripType;
  originCode: string;
  destinationCode: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  infants: number;
  cabin: CabinClass;
}

export interface DemoFlightResult {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  originCode: string;
  destinationCode: string;
  originCity: string;
  destinationCity: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
  stopCity?: string;
  cabin: CabinClass;
  priceUsdPerAdult: number;
  totalPriceUsd: number;
  baggage: string;
  refundable: boolean;
  seatsRemainingDemo: number;
}

export interface SavedSearch {
  id: string;
  label: string;
  params: FlightSearchParams;
  createdBy: string;
  createdAt: string;
}

export interface VisitorDayPoint {
  date: string;
  visits: number;
  uniqueVisitors: number;
  inquiries: number;
}

export interface VisitorAnalytics {
  daily: VisitorDayPoint[];
  referrers: { source: string; visits: number; sharePct: number }[];
  devices: { device: 'Desktop' | 'Mobile' | 'Tablet'; visits: number; sharePct: number }[];
  countries: { country: string; code: string; visits: number; sharePct: number }[];
}

export interface PartnerLogo {
  id: string;
  name: string;
  websiteUrl: string;
  logoUrl?: string;
  category: 'Airline' | 'Hotel Group' | 'Insurance' | 'DMC' | 'Payment';
  displayOrder: number;
  published: boolean;
}

export interface WebsiteOffer {
  id: string;
  title: string;
  destination: string;
  routeSummary: string;
  description: string;
  price: number;
  currency: CurrencyCode;
  imageUrl?: string;
  validUntil: string;
  status: 'Draft' | 'Published';
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  customerName: string;
  routeOrTrip: string;
  rating: 1 | 2 | 3 | 4 | 5;
  reviewText: string;
  published: boolean;
  createdAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'Bookings' | 'Visas & Entry' | 'Payments' | 'Changes & Refunds';
  displayOrder: number;
  published: boolean;
}

export interface TelegramMessage {
  id: string;
  sender: 'customer' | 'agent';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface TelegramConversation {
  id: string;
  customerName: string;
  handle: string;
  phone?: string;
  unreadCount: number;
  lastMessageAt: string;
  topic: string;
  messages: TelegramMessage[];
}

export type SubscriberSource = 'Website Footer' | 'Offer Landing Page' | 'Telegram Bot' | 'Booking Opt-In';

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  source: SubscriberSource;
  subscribedAt: string;
}

export type TeamRole = 'Owner' | 'Manager' | 'Agent' | 'Content editor' | 'Viewer';

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: TeamRole;
  department: string;
  active: boolean;
  lastActiveAt: string;
}

export type IntegrationId =
  | 'django-api'
  | 'ipak-yuli'
  | 'telegram'
  | 'whatsapp'
  | 'sip-voip'
  | 'flight-gds';

export interface IntegrationItem {
  id: IntegrationId;
  name: string;
  category: string;
  description: string;
  connected: boolean;
  endpointPlaceholder: string;
  configuredNote: string;
  envHint: string;
  setupSteps: string[];
}

export type ActivityEntityType =
  | 'Lead'
  | 'Booking'
  | 'Call'
  | 'Offer'
  | 'Partner'
  | 'Testimonial'
  | 'FAQ'
  | 'Subscriber'
  | 'Saved Search'
  | 'Team'
  | 'Telegram'
  | 'Account'
  | 'Integration';

export interface ActivityLogEntry {
  id: string;
  actor: string;
  action: string;
  entityType: ActivityEntityType;
  entityLabel: string;
  details?: string;
  timestamp: string;
}

export interface UserProfile {
  fullName: string;
  email: string;
  title: string;
  phone: string;
  preferredCurrency: CurrencyCode;
  defaultDateRange: '7d' | '30d' | '90d' | 'all';
  compactTables: boolean;
  emailAlerts: boolean;
  telegramAlerts: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  targetSection: NavSectionId;
  timestamp: string;
  read: boolean;
}

export interface CrmState {
  schemaVersion: number;
  profile: UserProfile;
  leads: Lead[];
  bookings: Booking[];
  calls: CallRecord[];
  savedSearches: SavedSearch[];
  visitors: VisitorAnalytics;
  partners: PartnerLogo[];
  offers: WebsiteOffer[];
  testimonials: Testimonial[];
  faqs: FaqItem[];
  telegramThreads: TelegramConversation[];
  subscribers: Subscriber[];
  teamMembers: TeamMember[];
  integrations: IntegrationItem[];
  activityLog: ActivityLogEntry[];
  notifications: NotificationItem[];
}
