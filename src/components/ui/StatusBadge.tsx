import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
  Ban,
} from 'lucide-react';

export type SemanticTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  tone: SemanticTone;
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const styles: Record<SemanticTone, { bg: string; fg: string; border: string }> = {
    success: {
      bg: 'var(--success-bg)',
      fg: 'var(--success-fg)',
      border: 'var(--success-border)',
    },
    warning: {
      bg: 'var(--warning-bg)',
      fg: 'var(--warning-fg)',
      border: 'var(--warning-border)',
    },
    danger: {
      bg: 'var(--danger-bg)',
      fg: 'var(--danger-fg)',
      border: 'var(--danger-border)',
    },
    info: {
      bg: 'var(--info-bg)',
      fg: 'var(--info-fg)',
      border: 'var(--info-border)',
    },
    neutral: {
      bg: 'var(--bg-surface-subtle)',
      fg: 'var(--text-secondary)',
      border: 'var(--border-subtle)',
    },
  };

  const Icon =
    tone === 'success'
      ? CheckCircle2
      : tone === 'warning'
      ? Clock
      : tone === 'danger'
      ? XCircle
      : tone === 'info'
      ? AlertCircle
      : label === 'Cancelled'
      ? Ban
      : FileText;

  const s = styles[tone];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium whitespace-nowrap"
      style={{
        backgroundColor: s.bg,
        color: s.fg,
        borderColor: s.border,
      }}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function getBookingStatusTone(status: string): SemanticTone {
  switch (status) {
    case 'Ticketed':
      return 'success';
    case 'Confirmed':
      return 'info';
    case 'Pending Ticket':
      return 'warning';
    case 'Cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function getPaymentStatusTone(status: string): SemanticTone {
  switch (status) {
    case 'Paid':
      return 'success';
    case 'Partially Paid':
      return 'warning';
    case 'Unpaid':
      return 'danger';
    case 'Refunded':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function getLeadStageTone(stage: string): SemanticTone {
  switch (stage) {
    case 'Won':
      return 'success';
    case 'Negotiation':
    case 'Quoted':
      return 'info';
    case 'Contacted':
      return 'warning';
    case 'Lost':
      return 'danger';
    default:
      return 'neutral';
  }
}
