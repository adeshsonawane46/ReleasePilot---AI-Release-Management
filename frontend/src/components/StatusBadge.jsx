export default function StatusBadge({ status }) {
  const map = {
    Approved: 'badge-success',
    'Needs Review': 'badge-warning',
    Analyzing: 'badge-info',
    Draft: 'badge-neutral',
    Rejected: 'badge-danger',
    Finalized: 'badge-success',
    'In Review': 'badge-warning',
    'Unsupported Claim': 'badge-danger',
    Edited: 'badge-info',
  };
  const cls = map[status] || 'badge-neutral';
  return (
    <span className={`badge ${cls}`}>
      <span className="dot" />
      {status}
    </span>
  );
}
