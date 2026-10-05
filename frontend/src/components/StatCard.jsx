export default function StatCard({ label, value, sub, icon, iconColor = 'var(--secondary)', trend }) {
  return (
    <div className="card stat-card">
      <div className="stat-card-header">
        <span className="label-md" style={{ color: 'var(--secondary)' }}>{label}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: iconColor }}>{icon}</span>
      </div>
      <div className="stat-card-value">
        <span className="headline-xl" style={{ letterSpacing: '-0.025em' }}>{value}</span>
        {trend && (
          <span className="label-sm" style={{ color: trend.color, background: trend.bg, padding: '2px 6px', borderRadius: 'var(--radius-sm)', border: `1px solid ${trend.border}` }}>
            {trend.text}
          </span>
        )}
      </div>
      {sub && (
        <div className="stat-card-sub">
          <span className="body-sm">{sub.label}</span>
          <span className="code-sm" style={{ fontWeight: 600, color: sub.color || 'var(--on-surface)' }}>{sub.value}</span>
        </div>
      )}
    </div>
  );
}