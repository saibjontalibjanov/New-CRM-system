import { Info, ShieldCheck } from 'lucide-react';
import { formatDateTime } from '../../lib/date';
import { useCrm } from '../../store/CrmContext';
import type { TeamRole } from '../../types/crm';
import { StatusBadge } from '../ui/StatusBadge';

const ROLES: TeamRole[] = ['Owner', 'Manager', 'Agent', 'Content editor', 'Viewer'];

const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  Owner: 'Full workspace configuration, financials, and team access',
  Manager: 'Manage bookings, leads, team queues, and website content',
  Agent: 'Handle leads, ticket searches, calls, and client bookings',
  'Content editor': 'Publish offers, FAQs, testimonials, and partner logos',
  Viewer: 'Read-only access to dashboards and booking records',
};

export function TeamAccessPage() {
  const { state, updateTeamMemberRole, toggleTeamMemberActive } = useCrm();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Team access
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Workspace roster and role assignment preview.
        </p>
      </div>

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
          <strong>Demo role controls only:</strong> Changing roles here updates local browser state for demonstration and does not enforce real authentication or backend security. Production permissions must be verified by Django IAM.
        </span>
      </div>

      <div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className="border-b"
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                <th className="py-3 px-4 font-medium">Team Member</th>
                <th className="py-3 px-4 font-medium">Department</th>
                <th className="py-3 px-4 font-medium">Demo Role</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Last Active</th>
                <th className="py-3 px-4 font-medium text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {state.teamMembers.map((member) => (
                <tr key={member.id} style={{ borderColor: 'var(--border-subtle)' }}>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {member.fullName}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {member.email}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {member.department}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <select
                      aria-label={`Demo role for ${member.fullName}`}
                      value={member.role}
                      onChange={(e) =>
                        updateTeamMemberRole(member.id, e.target.value as TeamRole)
                      }
                      className="px-2.5 py-1.5 text-xs rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-surface-subtle)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge
                      label={member.active ? 'Active (Demo)' : 'Paused'}
                      tone={member.active ? 'success' : 'neutral'}
                    />
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {formatDateTime(member.lastActiveAt)}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleTeamMemberActive(member.id)}
                      className="px-3 py-1.5 text-[11px] font-medium rounded-lg border"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {member.active ? 'Pause' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Reference */}
      <div
        className="p-5 rounded-xl border space-y-3"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden="true" />
          <h3 className="text-sm font-semibold">Intended role matrix (Django IAM target)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {ROLES.map((r) => (
            <div
              key={r}
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="font-semibold mb-1">{r}</div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {ROLE_DESCRIPTIONS[r]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
