import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Check, Menu, Palette, Search, X } from 'lucide-react';
import { getNavItem } from '../../lib/navigation';
import { THEMES } from '../../lib/themes';
import { formatDateTime } from '../../lib/date';
import { useCrm } from '../../store/CrmContext';
import type { NavSectionId } from '../../types/crm';

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

interface SearchHit {
  id: string;
  label: string;
  meta: string;
  section: NavSectionId;
}

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  const {
    state,
    theme,
    setTheme,
    activeSection,
    navigate,
    markNotificationRead,
    markAllNotificationsRead,
  } = useCrm();

  const currentNav = getNavItem(activeSection);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchFocused(false);
      }
      if (themeRef.current && !themeRef.current.contains(target)) {
        setThemeOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchFocused(false);
        setThemeOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const searchHits = useMemo<SearchHit[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const hits: SearchHit[] = [];

    for (const b of state.bookings) {
      if (
        b.reference.toLowerCase().includes(q) ||
        b.clientName.toLowerCase().includes(q) ||
        `${b.originCode} ${b.destinationCode}`.toLowerCase().includes(q) ||
        b.airline.toLowerCase().includes(q)
      ) {
        hits.push({
          id: `b-${b.id}`,
          label: `${b.reference} · ${b.clientName}`,
          meta: `Booking · ${b.originCode} → ${b.destinationCode} · ${b.bookingStatus}`,
          section: 'bookings',
        });
      }
    }

    for (const l of state.leads) {
      if (
        l.fullName.toLowerCase().includes(q) ||
        l.destination.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
      ) {
        hits.push({
          id: `l-${l.id}`,
          label: l.fullName,
          meta: `Lead · ${l.destination} · ${l.stage}`,
          section: 'leads',
        });
      }
    }

    for (const s of state.subscribers) {
      if (s.email.toLowerCase().includes(q) || (s.name ?? '').toLowerCase().includes(q)) {
        hits.push({
          id: `s-${s.id}`,
          label: s.email,
          meta: `Subscriber · ${s.source}`,
          section: 'subscribers',
        });
      }
    }

    for (const o of state.offers) {
      if (o.title.toLowerCase().includes(q) || o.destination.toLowerCase().includes(q)) {
        hits.push({
          id: `o-${o.id}`,
          label: o.title,
          meta: `Offer · ${o.destination} · ${o.status}`,
          section: 'offers',
        });
      }
    }

    return hits.slice(0, 8);
  }, [searchQuery, state.bookings, state.leads, state.offers, state.subscribers]);

  const unreadNotifs = state.notifications.filter((n) => !n.read).length;

  return (
    <header
      className="sticky top-0 z-30 h-16 px-4 sm:px-6 flex items-center justify-between gap-3 border-b"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Left: Mobile menu button + Section Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-lg border transition-colors shrink-0"
          style={{
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-xs font-medium hidden sm:inline whitespace-nowrap"
              style={{ color: 'var(--text-muted)' }}
            >
              {currentNav.group}
            </span>
            <span
              className="text-xs hidden sm:inline"
              style={{ color: 'var(--border-strong)' }}
              aria-hidden="true"
            >
              /
            </span>
            <h1
              className="text-sm sm:text-base font-semibold tracking-tight truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {currentNav.label}
            </h1>
          </div>
        </div>
      </div>

      {/* Center: Global Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
        <Search
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label="Global CRM search"
          placeholder="Search bookings, leads, routes, offers..."
          value={searchQuery}
          onFocus={() => setSearchFocused(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchFocused(true);
          }}
          className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border transition-colors"
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            borderColor: searchFocused ? 'var(--accent)' : 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear global search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {searchFocused && searchQuery.trim() && (
          <div
            className="absolute left-0 right-0 mt-1.5 rounded-xl border py-1.5 z-40 max-h-80 overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-popover)',
              borderColor: 'var(--border-subtle)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {searchHits.length === 0 ? (
              <div className="px-3.5 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                No matching records for &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              searchHits.map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  onClick={() => {
                    navigate(hit.section);
                    setSearchFocused(false);
                  }}
                  className="w-full text-left px-3.5 py-2 transition-colors hover:opacity-90"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="text-xs font-semibold truncate">{hit.label}</div>
                  <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {hit.meta}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: Theme Picker + Notifications + Demo Workspace Badge */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Theme Picker */}
        <div ref={themeRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setThemeOpen((o) => !o);
              setNotifOpen(false);
            }}
            aria-expanded={themeOpen}
            aria-haspopup="menu"
            aria-label="Select color theme"
            className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <Palette className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <span className="hidden sm:inline">
              {THEMES.find((t) => t.id === theme)?.name ?? 'Theme'}
            </span>
          </button>

          {themeOpen && (
            <div
              role="menu"
              aria-label="Theme options"
              className="absolute right-0 mt-1.5 w-60 rounded-xl border p-1.5 z-40"
              style={{
                backgroundColor: 'var(--bg-popover)',
                borderColor: 'var(--border-subtle)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div
                className="px-2.5 py-1.5 text-[11px] font-semibold"
                style={{ color: 'var(--text-muted)' }}
              >
                Workspace theme
              </div>
              {THEMES.map((item) => {
                const selected = item.id === theme;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => {
                      setTheme(item.id);
                      setThemeOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition-colors"
                    style={{
                      backgroundColor: selected ? 'var(--accent-soft)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="inline-flex items-center -space-x-1 shrink-0" aria-hidden="true">
                        <span
                          className="w-3.5 h-3.5 rounded-full border"
                          style={{
                            backgroundColor: item.swatches.sidebar,
                            borderColor: 'var(--border-strong)',
                          }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border"
                          style={{
                            backgroundColor: item.swatches.accent,
                            borderColor: 'var(--border-strong)',
                          }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border"
                          style={{
                            backgroundColor: item.swatches.canvas,
                            borderColor: 'var(--border-strong)',
                          }}
                        />
                      </span>
                      <span className="font-medium truncate">{item.name}</span>
                    </span>
                    {selected && (
                      <Check
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: 'var(--accent)' }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((o) => !o);
              setThemeOpen(false);
            }}
            aria-expanded={notifOpen}
            aria-label={`Notifications (${unreadNotifs} unread)`}
            className="relative p-2 rounded-lg border transition-colors shrink-0"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-fg)',
                }}
              >
                {unreadNotifs}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 mt-1.5 w-80 max-w-[90vw] rounded-xl border z-40 overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-popover)',
                borderColor: 'var(--border-subtle)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div
                className="flex items-center justify-between px-3.5 py-2.5 border-b"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Notifications
                </span>
                {unreadNotifs > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-medium hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {state.notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id);
                      navigate(n.targetSection);
                      setNotifOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 transition-colors"
                    style={{
                      backgroundColor: n.read ? 'transparent' : 'var(--accent-soft)',
                    }}
                  >
                    <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {n.title}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {n.description}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      {formatDateTime(n.timestamp)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Demo workspace label */}
        <span
          className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md border text-[11px] font-medium whitespace-nowrap shrink-0"
          style={{
            backgroundColor: 'var(--gold-soft)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          Demo workspace
        </span>
      </div>
    </header>
  );
}
