import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { ActivityLogPage } from './components/pages/ActivityLogPage';
import { BookingRecordsPage } from './components/pages/BookingRecordsPage';
import { IntegrationsPage } from './components/pages/IntegrationsPage';
import { LeadsPage } from './components/pages/LeadsPage';
import { MyAccountPage } from './components/pages/MyAccountPage';
import { OverviewPage } from './components/pages/OverviewPage';
import { PartnerLogosPage } from './components/pages/PartnerLogosPage';
import { PhoneCallsPage } from './components/pages/PhoneCallsPage';
import { SavedSearchesPage } from './components/pages/SavedSearchesPage';
import { SubscribersPage } from './components/pages/SubscribersPage';
import { TeamAccessPage } from './components/pages/TeamAccessPage';
import { TelegramInboxPage } from './components/pages/TelegramInboxPage';
import { TestimonialsPage } from './components/pages/TestimonialsPage';
import { TicketSearchPage } from './components/pages/TicketSearchPage';
import { WebsiteFaqsPage } from './components/pages/WebsiteFaqsPage';
import { WebsiteOffersPage } from './components/pages/WebsiteOffersPage';
import { WebsiteVisitorsPage } from './components/pages/WebsiteVisitorsPage';
import { CrmProvider, useCrm } from './store/CrmContext';

function PageRouter() {
  const { activeSection } = useCrm();

  switch (activeSection) {
    case 'overview':
      return <OverviewPage />;
    case 'leads':
      return <LeadsPage />;
    case 'calls':
      return <PhoneCallsPage />;
    case 'ticket-search':
      return <TicketSearchPage />;
    case 'visitors':
      return <WebsiteVisitorsPage />;
    case 'partners':
      return <PartnerLogosPage />;
    case 'offers':
      return <WebsiteOffersPage />;
    case 'testimonials':
      return <TestimonialsPage />;
    case 'faqs':
      return <WebsiteFaqsPage />;
    case 'telegram':
      return <TelegramInboxPage />;
    case 'subscribers':
      return <SubscribersPage />;
    case 'bookings':
      return <BookingRecordsPage />;
    case 'saved-searches':
      return <SavedSearchesPage />;
    case 'team':
      return <TeamAccessPage />;
    case 'integrations':
      return <IntegrationsPage />;
    case 'activity':
      return <ActivityLogPage />;
    case 'account':
      return <MyAccountPage />;
    default:
      return <OverviewPage />;
  }
}

function CrmShell() {
  const { recoveredWarning, dismissRecoveredWarning, toasts, dismissToast } = useCrm();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {recoveredWarning && (
          <div
            className="mx-4 sm:mx-6 mt-4 px-4 py-3 rounded-xl border flex items-center justify-between gap-3 text-xs"
            style={{
              backgroundColor: 'var(--warning-bg)',
              borderColor: 'var(--warning-border)',
              color: 'var(--warning-fg)',
            }}
          >
            <span className="inline-flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Saved demo data appeared outdated or corrupted and was safely restored to default sample records.
            </span>
            <button
              type="button"
              onClick={dismissRecoveredWarning}
              aria-label="Dismiss storage recovery notice"
              className="p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          <PageRouter />
        </main>
      </div>

      {/* Non-intrusive Toast Feedback */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className="px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs"
              style={{
                backgroundColor: 'var(--bg-popover)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <span className="inline-flex items-center gap-2">
                {t.tone === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--success-fg)' }} />
                ) : (
                  <Info className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                )}
                <span>{t.text}</span>
              </span>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
                className="p-0.5 rounded"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <CrmProvider>
      <CrmShell />
    </CrmProvider>
  );
}
