const TONES = {
  primary: 'bg-lagoon text-white hover:bg-lagoon-dark disabled:bg-lagoon/50',
  secondary: 'bg-white text-ink border border-line hover:bg-lagoon-tint disabled:text-ink-soft/50',
  danger: 'bg-brick text-white hover:bg-brick/90 disabled:bg-brick/50',
  ghost: 'text-lagoon-dark hover:bg-lagoon-tint disabled:text-ink-soft/50',
};

export default function Button({
  tone = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const pad = size === 'sm' ? 'min-h-9 px-3 text-sm' : 'min-h-11 px-4';
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed ${pad} ${TONES[tone]} ${className}`}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
