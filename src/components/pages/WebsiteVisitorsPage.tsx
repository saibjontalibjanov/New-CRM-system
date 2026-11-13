import { useMemo, useState } from 'react';
import { Globe, Info, Laptop, Share2 } from 'lucide-react';
import { useCrm } from '../../store/CrmContext';
import { VisitorTrendChart } from '../ui/Charts';

export function WebsiteVisitorsPage() {
  const { state } = useCrm();
  const [windowDays, setWindowDays] = useState<'7d' | '14d' | '30d'>('30d');

  const scopedDaily = useMemo(() => {
    const all = state.visitors.daily;
    if (windowDays === '7d') return all.slice(-3);
    if (windowDays === '14d') return all.slice(-5);
    return all;
  }, [state.visitors.daily, windowDays]);

  const totalVisits = useMemo(
    () => scopedDaily.reduce((s, d) => s + d.visits, 0),
    [scopedDaily]
  );
  const totalUnique = useMemo(
    () => scopedDaily.reduce((s, d) => s + d.uniqueVisitors, 0),
    [scopedDaily]
  );
  const totalInquiries = useMemo(
    () => scopedDaily.reduce((s, d) => s + d.inquiries, 0),
    [scopedDaily]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Website visitors
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Traffic trends, top referrers, devices, and visitor countries.
          </p>
        </div>

        <div
          className="inline-flex items-center p-1 rounded-lg border self-start sm:self-auto"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {(['7d', '14d', '30d'] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWindowDays(w)}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
              style={{
                backgroundColor: windowDays === w ? 'var(--accent)' : 'transparent',
                color: windowDays === w ? 'var(--accent-fg)' : 'var(--text-secondary)',
              }}
            >
              Last {w.replace('d', ' days')}
            </button>
          ))}
        </div>
      </div>

      {/* Sample Data Banner */}
      <div
        className="px-4 py-3 rounded-xl border flex items-start gap-2.5 text-xs"
        style={{
          backgroundColor: 'var(--warning-bg)',
          borderColor: 'var(--warning-border)',
          color: 'var(--warning-fg)',
        }}
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          <strong>Sample analytics data:</strong> Displayed visitor counts, referrers, and country breakdowns are demonstration samples until website telemetry is connected to your Django backend.
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="p-4 rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Sample page visits
          </div>
          <div className="text-2xl font-bold mt-1 tabular-nums">{totalVisits.toLocaleString()}</div>
        </div>
        <div
          className="p-4 rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Sample unique visitors
          </div>
          <div className="text-2xl font-bold mt-1 tabular-nums">{totalUnique.toLocaleString()}</div>
        </div>
        <div
          className="p-4 rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Sample quote inquiries
          </div>
          <div className="text-2xl font-bold mt-1 tabular-nums">{totalInquiries.toLocaleString()}</div>
        </div>
      </div>

      {/* Trend Chart */}
      <div
        className="p-5 rounded-xl border"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Daily visitor volume (sample)
        </h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Hover data points for sample visits, unique visitors, and inquiries
        </p>
        <VisitorTrendChart data={scopedDaily} />
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Referrers */}
        <div
          className="p-5 rounded-xl border space-y-3"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Top referrers</h3>
            <Share2 className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden="true" />
          </div>
          <div className="space-y-3">
            {state.visitors.referrers.map((r) => (
              <div key={r.source} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate pr-2 font-medium">{r.source}</span>
                  <span className="tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {r.visits.toLocaleString()} ({r.sharePct}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${r.sharePct}%`, backgroundColor: 'var(--chart-1)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Devices */}
        <div
          className="p-5 rounded-xl border space-y-3"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Devices</h3>
            <Laptop className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden="true" />
          </div>
          <div className="space-y-3">
            {state.visitors.devices.map((d) => (
              <div key={d.device} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{d.device}</span>
                  <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {d.visits.toLocaleString()} ({d.sharePct}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${d.sharePct}%`, backgroundColor: 'var(--chart-2)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Countries */}
        <div
          className="p-5 rounded-xl border space-y-3"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Countries</h3>
            <Globe className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden="true" />
          </div>
          <div className="space-y-3">
            {state.visitors.countries.map((c) => (
              <div key={c.code} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    <span className="font-mono-code mr-1.5" style={{ color: 'var(--text-muted)' }}>
                      {c.code}
                    </span>
                    {c.country}
                  </span>
                  <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {c.visits.toLocaleString()} ({c.sharePct}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.sharePct}%`, backgroundColor: 'var(--chart-3)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
