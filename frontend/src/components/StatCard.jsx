export default function StatCard({ label, value, sub, icon, iconColor = 'var(--secondary)', trend }) {
  return (
    <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 128 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="label-md" style={{ color: 'var(--secondary)' }}>{label}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: iconColor }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)', margin: 'var(--space-sm) 0' }}>
        <span className="headline-xl" style={{ letterSpacing: '-0.025em' }}>{value}</span>
        {trend && (
          <span className="label-sm" style={{ color: trend.color, background: trend.bg, padding: '2px 6px', borderRadius: 'var(--radius-sm)', border: `1px solid ${trend.border}` }}>
            {trend.text}
          </span>
        )}
      </div>
      {sub && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--space-sm)', borderTop: '1px solid #f1f5f9', color: 'var(--secondary)' }}>
          <span className="body-sm">{sub.label}</span>
          <span className="code-sm" style={{ fontWeight: 600, color: sub.color || 'var(--on-surface)' }}>{sub.value}</span>
        </div>
      )}
    </div>
  );
}
