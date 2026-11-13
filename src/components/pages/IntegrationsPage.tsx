import { useState } from 'react';
import { ChevronRight, Info, Plug, Server, ShieldAlert } from 'lucide-react';
import { useCrm } from '../../store/CrmContext';
import type { IntegrationItem } from '../../types/crm';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';

export function IntegrationsPage() {
  const { state } = useCrm();
  const [selected, setSelected] = useState<IntegrationItem | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Integrations
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Connection status and backend setup architecture for StarAviaTravel external services.
        </p>
      </div>

      <div
        className="px-4 py-3 rounded-xl border flex items-start gap-2.5 text-xs"
        style={{
          backgroundColor: 'var(--info-bg)',
          borderColor: 'var(--info-border)',
          color: 'var(--info-fg)',
        }}
      >
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          <strong>Security boundary:</strong> All listed services are currently unconfigured in this browser demo. Never enter or store API secrets, merchant keys, or bot tokens in frontend code or localStorage — configure credentials strictly on your Django server.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {state.integrations.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-xl border flex flex-col justify-between gap-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: 'var(--bg-surface-subtle)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--accent)',
                    }}
                  >
                    <Plug className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">{item.name}</h3>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {item.category}
                    </div>
                  </div>
                </div>
                <StatusBadge
                  label={item.connected ? 'Connected' : 'Not connected'}
                  tone={item.connected ? 'success' : 'warning'}
                />
              </div>

              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {item.description}
              </p>

              <div
                className="p-2.5 rounded-lg border text-[11px]"
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  Endpoint placeholder
                </div>
                <div className="font-mono-code truncate" style={{ color: 'var(--text-primary)' }}>
                  {item.endpointPlaceholder}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-[11px] font-mono-code truncate" style={{ color: 'var(--text-muted)' }}>
                {item.envHint}
              </span>
              <button
                type="button"
                onClick={() => setSelected(item)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border shrink-0 transition-colors"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--accent)',
                }}
              >
                Setup guide
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.name} — Setup guidance` : ''}
        subtitle={selected ? `${selected.category} · Status: Not connected` : undefined}
      >
        {selected && (
          <div className="space-y-4 text-xs">
            <div
              className="p-3 rounded-lg border flex items-start gap-2"
              style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>{selected.configuredNote}</span>
            </div>

            <div className="space-y-2">
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Target Django endpoint placeholder
              </div>
              <div
                className="px-3 py-2 rounded-lg border font-mono-code break-all"
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {selected.endpointPlaceholder}
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Required environment / server configuration
              </div>
              <div
                className="px-3 py-2 rounded-lg border font-mono-code inline-flex items-center gap-2"
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <Server className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                {selected.envHint}
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Integration checklist
              </div>
              <ol className="list-decimal pl-4 space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
                {selected.setupSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
