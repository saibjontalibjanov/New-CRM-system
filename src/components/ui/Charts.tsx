import { useState } from 'react';
import { formatMoneyFromUsd } from '../../lib/currency';
import type { LeadSourceDatum, RevenueTrendPoint } from '../../lib/metrics';
import type { CurrencyCode, VisitorDayPoint } from '../../types/crm';

export function RevenueTrendChart({
  data,
  currency,
}: {
  data: RevenueTrendPoint[];
  currency: CurrencyCode;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div
        className="h-56 flex items-center justify-center text-xs rounded-lg border"
        style={{
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
      >
        No booking activity in the selected date range.
      </div>
    );
  }

  const maxVal = Math.max(
    1,
    ...data.map((d) => Math.max(d.bookingValueUsd, d.collectedUsd))
  );
  const width = 560;
  const height = 210;
  const padLeft = 56;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 32;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const groupW = plotW / data.length;
  const barW = Math.min(24, Math.max(8, groupW * 0.28));

  const ticks = [0, 0.5, 1];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-56 overflow-visible"
        role="img"
        aria-label="Booking value and collected payments trend chart"
      >
        {ticks.map((t) => {
          const y = padTop + plotH * (1 - t);
          return (
            <g key={t}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke="var(--chart-grid)"
                strokeDasharray={t === 0 ? undefined : '3 3'}
              />
              <text
                x={padLeft - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-muted)"
                className="tabular-nums"
              >
                {formatMoneyFromUsd(maxVal * t, currency, true)}
              </text>
            </g>
          );
        })}

        {data.map((pt, i) => {
          const cx = padLeft + groupW * i + groupW / 2;
          const bookingH = (pt.bookingValueUsd / maxVal) * plotH;
          const collectedH = (pt.collectedUsd / maxVal) * plotH;
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={pt.key}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              <rect
                x={padLeft + groupW * i + 2}
                y={padTop}
                width={Math.max(10, groupW - 4)}
                height={plotH}
                rx={6}
                fill={isHovered ? 'var(--bg-surface-subtle)' : 'transparent'}
              />
              <rect
                x={cx - barW - 2}
                y={padTop + plotH - bookingH}
                width={barW}
                height={Math.max(2, bookingH)}
                rx={4}
                fill="var(--chart-1)"
                opacity={hoveredIdx === null || isHovered ? 1 : 0.65}
              />
              <rect
                x={cx + 2}
                y={padTop + plotH - collectedH}
                width={barW}
                height={Math.max(2, collectedH)}
                rx={4}
                fill="var(--chart-2)"
                opacity={hoveredIdx === null || isHovered ? 1 : 0.65}
              />
              <text
                x={cx}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-muted)"
              >
                {pt.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          className="absolute top-2 right-2 px-3 py-2 rounded-lg text-xs pointer-events-none border"
          style={{
            backgroundColor: 'var(--tooltip-bg)',
            color: 'var(--tooltip-fg)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div className="font-semibold mb-1">{data[hoveredIdx].label}</div>
          <div className="tabular-nums">
            Booking value: {formatMoneyFromUsd(data[hoveredIdx].bookingValueUsd, currency)}
          </div>
          <div className="tabular-nums">
            Collected: {formatMoneyFromUsd(data[hoveredIdx].collectedUsd, currency)}
          </div>
          <div className="opacity-80 mt-0.5 tabular-nums">
            {data[hoveredIdx].bookingCount} booking(s)
          </div>
        </div>
      )}

      <div className="flex items-center gap-5 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm inline-block"
            style={{ backgroundColor: 'var(--chart-1)' }}
          />
          Booking value
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm inline-block"
            style={{ backgroundColor: 'var(--chart-2)' }}
          />
          Collected payments
        </span>
      </div>
    </div>
  );
}

const CHART_VARS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--accent)',
];

export function LeadSourceChart({ data }: { data: LeadSourceDatum[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.count, 0);

  if (data.length === 0 || total === 0) {
    return (
      <div
        className="h-56 flex items-center justify-center text-xs rounded-lg border"
        style={{
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
      >
        No leads in the selected date range.
      </div>
    );
  }

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90" role="img" aria-label="Lead source breakdown chart">
          {data.map((d, idx) => {
            const pct = d.count / total;
            const dash = pct * circumference;
            const offset = -cumulative * circumference;
            cumulative += pct;
            const isHovered = hovered === idx;

            return (
              <circle
                key={d.source}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={CHART_VARS[idx % CHART_VARS.length]}
                strokeWidth={isHovered ? 20 : 16}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                className="transition-all duration-150 cursor-pointer"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {hovered !== null && data[hovered] ? data[hovered].count : total}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {hovered !== null && data[hovered] ? `${data[hovered].sharePct}%` : 'Total leads'}
          </span>
        </div>
      </div>

      <ul className="flex-1 w-full space-y-2">
        {data.map((item, idx) => (
          <li
            key={item.source}
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
            className="flex items-center justify-between gap-3 text-xs px-2 py-1 rounded-md transition-colors"
            style={{
              backgroundColor: hovered === idx ? 'var(--bg-surface-subtle)' : 'transparent',
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: CHART_VARS[idx % CHART_VARS.length] }}
              />
              <span className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>
                {item.source}
              </span>
            </div>
            <div className="flex items-center gap-2 tabular-nums shrink-0" style={{ color: 'var(--text-secondary)' }}>
              <span>{item.count}</span>
              <span style={{ color: 'var(--text-muted)' }}>({item.sharePct}%)</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VisitorTrendChart({ data }: { data: VisitorDayPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (data.length === 0) return null;

  const width = 620;
  const height = 210;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 30;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const maxVisits = Math.max(100, ...data.map((d) => d.visits));

  const points = data.map((d, i) => {
    const x = padL + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
    const y = padT + plotH * (1 - d.visits / maxVisits);
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padT + plotH} L ${points[0].x} ${padT + plotH} Z`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-56 overflow-visible"
        role="img"
        aria-label="Sample website visitor trend chart"
      >
        {[0, 0.5, 1].map((t) => {
          const y = padT + plotH * (1 - t);
          return (
            <g key={t}>
              <line
                x1={padL}
                x2={width - padR}
                y1={y}
                y2={y}
                stroke="var(--chart-grid)"
                strokeDasharray={t === 0 ? undefined : '3 3'}
              />
              <text
                x={padL - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-muted)"
                className="tabular-nums"
              >
                {Math.round(maxVisits * t)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="var(--accent-soft)" />
        <path d={linePath} fill="none" stroke="var(--chart-1)" strokeWidth="2.5" />

        {points.map((p, i) => (
          <g
            key={p.date}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer"
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={hovered === i ? 6 : 4}
              fill="var(--chart-1)"
              stroke="var(--bg-surface)"
              strokeWidth="2"
            />
            <text
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="var(--text-muted)"
            >
              {p.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>

      {hovered !== null && points[hovered] && (
        <div
          className="absolute top-2 right-2 px-3 py-2 rounded-lg text-xs border pointer-events-none"
          style={{
            backgroundColor: 'var(--tooltip-bg)',
            color: 'var(--tooltip-fg)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div className="font-semibold mb-1">{points[hovered].date} (Sample)</div>
          <div className="tabular-nums">Visits: {points[hovered].visits}</div>
          <div className="tabular-nums">Unique: {points[hovered].uniqueVisitors}</div>
          <div className="tabular-nums">Inquiries: {points[hovered].inquiries}</div>
        </div>
      )}
    </div>
  );
}
