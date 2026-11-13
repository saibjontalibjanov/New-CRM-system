import React, { useState } from 'react';
import { Check, Info, RotateCcw, Save } from 'lucide-react';
import { CURRENCIES } from '../../lib/currency';
import { THEMES } from '../../lib/themes';
import { useCrm } from '../../store/CrmContext';
import type { CurrencyCode } from '../../types/crm';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export function MyAccountPage() {
  const { state, theme, setTheme, updateProfile, resetDemoData } = useCrm();

  const [fullName, setFullName] = useState(state.profile.fullName);
  const [email, setEmail] = useState(state.profile.email);
  const [title, setTitle] = useState(state.profile.title);
  const [phone, setPhone] = useState(state.profile.phone);
  const [preferredCurrency, setPreferredCurrency] = useState<CurrencyCode>(
    state.profile.preferredCurrency
  );
  const [defaultDateRange, setDefaultDateRange] = useState(state.profile.defaultDateRange);
  const [emailAlerts, setEmailAlerts] = useState(state.profile.emailAlerts);
  const [telegramAlerts, setTelegramAlerts] = useState(state.profile.telegramAlerts);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    updateProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      title: title.trim(),
      phone: phone.trim(),
      preferredCurrency,
      defaultDateRange,
      emailAlerts,
      telegramAlerts,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          My account
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Manage your profile, currency display preference, workspace appearance, and demo data reset.
        </p>
      </div>

      {/* Appearance Panel with miniature preview cards for all 5 themes */}
      <section
        className="p-5 rounded-xl border space-y-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Appearance
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Choose a color theme. Selection is applied immediately, saved across reloads, and preserves all CRM records.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {THEMES.map((item) => {
            const selected = item.id === theme;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTheme(item.id)}
                aria-pressed={selected}
                className="text-left rounded-xl border p-2.5 transition-all flex flex-col gap-2.5"
                style={{
                  backgroundColor: selected ? 'var(--accent-soft)' : 'var(--bg-surface-subtle)',
                  borderColor: selected ? 'var(--accent)' : 'var(--border-subtle)',
                }}
              >
                {/* Miniature UI Preview Card */}
                <div
                  className="h-20 rounded-lg border overflow-hidden flex"
                  style={{
                    backgroundColor: item.swatches.canvas,
                    borderColor: item.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
                  }}
                  aria-hidden="true"
                >
                  {/* Mini Sidebar */}
                  <div
                    className="w-7 h-full p-1.5 flex flex-col gap-1 border-r"
                    style={{
                      backgroundColor: item.swatches.sidebar,
                      borderColor: item.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: item.swatches.detail }}
                    />
                    <div
                      className="w-full h-1 rounded-full opacity-40"
                      style={{ backgroundColor: item.swatches.accent }}
                    />
                    <div
                      className="w-3/4 h-1 rounded-full opacity-30"
                      style={{ backgroundColor: item.swatches.text }}
                    />
                  </div>
                  {/* Mini Content */}
                  <div className="flex-1 p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-10 h-1.5 rounded-full opacity-65"
                        style={{ backgroundColor: item.swatches.text }}
                      />
                      <div
                        className="w-4 h-2 rounded-sm"
                        style={{ backgroundColor: item.swatches.accent }}
                      />
                    </div>
                    <div
                      className="h-9 rounded border p-1.5 flex items-center justify-between"
                      style={{
                        backgroundColor: item.swatches.card,
                        borderColor: item.isDark
                          ? 'rgba(255,255,255,0.10)'
                          : 'rgba(0,0,0,0.08)',
                      }}
                    >
                      <div
                        className="w-8 h-1.5 rounded-full opacity-45"
                        style={{ backgroundColor: item.swatches.text }}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.swatches.detail }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {item.name}
                  </span>
                  {selected && (
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-fg)',
                      }}
                    >
                      <Check className="w-2.5 h-2.5" aria-hidden="true" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Profile & Currency Form */}
      <form
        onSubmit={handleSave}
        className="p-5 rounded-xl border space-y-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Profile &amp; display preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Role title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Work phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Currency display preference
            </label>
            <select
              value={preferredCurrency}
              onChange={(e) => setPreferredCurrency(e.target.value as CurrencyCode)}
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Default overview date range
            </label>
            <select
              value={defaultDateRange}
              onChange={(e) =>
                setDefaultDateRange(e.target.value as '7d' | '30d' | '90d' | 'all')
              }
              className="w-full px-3 py-2 text-xs rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All records</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-5 pt-1 text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
            />
            <span>Demo booking summary notifications</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={telegramAlerts}
              onChange={(e) => setTelegramAlerts(e.target.checked)}
            />
            <span>Unread Telegram inbox badges</span>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            Save preferences
          </button>
        </div>
      </form>

      {/* Account Auth Note + Reset Demo Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="p-5 rounded-xl border space-y-2"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Info className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <span>Authentication &amp; password settings</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Password changes, 2FA, and session management are intentionally omitted in demo mode because authentication is handled by your connected Django backend.
          </p>
        </div>

        <div
          className="p-5 rounded-xl border flex flex-col justify-between gap-3"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              Reset demo data
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Restore all leads, bookings, website content, and activity logs back to the initial StarAviaTravel sample dataset.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border"
              style={{
                borderColor: 'var(--danger-border)',
                color: 'var(--danger-fg)',
                backgroundColor: 'var(--danger-bg)',
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset demo data
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={resetDemoData}
        title="Reset all demo CRM data?"
        description="This clears your local edits (created bookings, leads, notes, offers, and activity logs) and restores the default sample workspace. Your selected color theme will be kept."
        confirmLabel="Reset demo data"
      />
    </div>
  );
}
