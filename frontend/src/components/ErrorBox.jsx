import { errorMessage } from '../utils/format';

export default function ErrorBox({ error, message, onRetry }) {
  const text = message || errorMessage(error);
  if (!text) return null;
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-md border border-brick/30 bg-brick-tint px-4 py-3 text-brick"
    >
      <p className="font-medium">{text}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="shrink-0 font-semibold underline">
          Try again
        </button>
      )}
    </div>
  );
}
