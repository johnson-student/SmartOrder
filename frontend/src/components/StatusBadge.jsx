import { STATUS } from '../utils/status';

// Colour AND text, so the status never depends on colour alone.
export default function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, tone: 'bg-line text-ink-soft' };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${s.tone}`}
    >
      {s.label}
    </span>
  );
}
