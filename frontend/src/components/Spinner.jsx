export default function Spinner({ label = 'Loading', fullPage = false }) {
  return (
    <div
      role="status"
      className={`flex items-center justify-center gap-3 text-ink-soft ${fullPage ? 'min-h-screen' : 'py-10'}`}
    >
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-lagoon motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span>{label}…</span>
    </div>
  );
}
