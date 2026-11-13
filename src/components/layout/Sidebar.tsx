import React, { useEffect } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Phone,
  Plane,
  Plug,
  Send,
  ShieldCheck,
  Tag,
  Ticket,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { NAV_ITEMS } from '../../lib/navigation';
import { useCrm } from '../../store/CrmContext';
import type { NavSectionId } from '../../types/crm';

const NAV_ICONS: Record<NavSectionId, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  leads: Users,
  calls: Phone,
  'ticket-search': Plane,
  visitors: BarChart3,
  partners: Award,
  offers: Tag,
  testimonials: MessageSquare,
  faqs: HelpCircle,
  telegram: Send,
  subscribers: Mail,
  bookings: Ticket,
  'saved-searches': Bookmark,
  team: ShieldCheck,
  integrations: Plug,
  activity: Activity,
  account: UserCircle,
};

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function StarBrandMark() {
  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
      style={{
        backgroundColor: 'var(--sidebar-active)',
        borderColor: 'var(--sidebar-border)',
        color: 'var(--sidebar-brand-accent)',
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 2.2l2.15 6.62 6.85.56-5.22 4.46 1.62 6.76L12 17l-5.4 3.6 1.62-6.76L3 9.38l6.85-.56L12 2.2z" />
      </svg>
    </div>
  );
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { state, activeSection, navigate } = useCrm();
  const unreadTelegram = state.telegramThreads.reduce((sum, t) => sum + t.unreadCount, 0);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, onCloseMobile]);

  const handleSelect = (id: NavSectionId) => {
    navigate(id);
    onCloseMobile();
  };

  const renderSidebarInner = (isMobileDrawer: boolean) => {
    const isCompact = !isMobileDrawer && collapsed;

    return (
      <div
        className="flex flex-col h-full select-none border-r"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--sidebar-border)',
          color: 'var(--sidebar-text)',
        }}
      >
        {/* Brand Header */}
        <div
          className="h-16 px-3.5 flex items-center justify-between gap-2 border-b shrink-0"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <button
            type="button"
            onClick={() => handleSelect('overview')}
            className="flex items-center gap-2.5 min-w-0 text-left rounded-lg p-1 transition-opacity hover:opacity-90"
          >
            <StarBrandMark />
            {!isCompact && (
              <div className="min-w-0">
                <div
                  className="text-sm font-bold tracking-[0.14em] leading-tight truncate"
                  style={{ color: 'var(--sidebar-brand-accent)' }}
                >
                  STARAVIA
                </div>
                <div
                  className="text-[10px] font-medium tracking-[0.18em] leading-tight mt-0.5 truncate"
                  style={{ color: 'var(--sidebar-text-muted)' }}
                >
                  ADMIN &amp; CRM
                </div>
              </div>
            )}
          </button>

          {isMobileDrawer ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--sidebar-text-muted)' }}
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-lg transition-colors shrink-0 hidden lg:inline-flex"
              style={{
                color: 'var(--sidebar-text-muted)',
                backgroundColor: 'transparent',
              }}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Scrollable 17-item navigation */}
        <nav
          aria-label="Primary CRM Navigation"
          className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = NAV_ICONS[item.id];
            const isActive = activeSection === item.id;
            const showTelegramCount = item.id === 'telegram' && unreadTelegram > 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={isCompact ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCompact ? 'justify-center px-2' : 'justify-between px-3'
                } py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-150`}
                style={{
                  backgroundColor: isActive ? 'var(--sidebar-active)' : 'transparent',
                  color: isActive ? 'var(--sidebar-text)' : 'var(--sidebar-text-muted)',
                  boxShadow: isActive
                    ? 'inset 0 0 0 1px var(--sidebar-border)'
                    : undefined,
                }}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="shrink-0"
                    style={{
                      color: isActive
                        ? 'var(--sidebar-brand-accent)'
                        : 'var(--sidebar-text-muted)',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  {!isCompact && <span className="truncate">{item.label}</span>}
                </span>

                {!isCompact && showTelegramCount && (
                  <span
                    className="px-1.5 py-0.5 text-[11px] font-semibold rounded-md tabular-nums shrink-0"
                    style={{
                      backgroundColor: 'var(--sidebar-brand-accent)',
                      color: '#111615',
                    }}
                  >
                    {unreadTelegram}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Account Footer */}
        <div
          className="p-2.5 border-t shrink-0"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <button
            type="button"
            onClick={() => handleSelect('account')}
            aria-label="Open My account settings"
            className={`w-full flex items-center ${
              isCompact ? 'justify-center' : 'gap-2.5'
            } p-2 rounded-lg text-left transition-colors hover:opacity-90`}
            style={{ backgroundColor: 'var(--sidebar-hover)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{
                backgroundColor: 'var(--sidebar-brand-accent)',
                color: '#111615',
              }}
            >
              {state.profile.fullName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            {!isCompact && (
              <div className="min-w-0 flex-1">
                <div
                  className="text-xs font-semibold truncate"
                  style={{ color: 'var(--sidebar-text)' }}
                >
                  {state.profile.fullName}
                </div>
                <div
                  className="text-[11px] truncate"
                  style={{ color: 'var(--sidebar-text-muted)' }}
                >
                  {state.profile.title}
                </div>
              </div>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop collapsible sidebar */}
      <aside
        className={`hidden lg:block shrink-0 h-screen sticky top-0 transition-[width] duration-150 ${
          collapsed ? 'w-[72px]' : 'w-[252px]'
        }`}
      >
        {renderSidebarInner(false)}
      </aside>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation drawer"
        >
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">
            {renderSidebarInner(true)}
          </div>
        </div>
      )}
    </>
  );
}
