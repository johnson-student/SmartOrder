import { useId } from 'react';

const base =
  'w-full rounded-md border border-line bg-white px-3 min-h-11 text-ink placeholder:text-ink-soft/60 focus:border-lagoon';

// A label + input (or select / textarea) with an optional hint and error message.
export default function Field({
  label,
  error,
  hint,
  as = 'input',
  className = '',
  children,
  ...props
}) {
  const id = useId();
  const Tag = as;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      <Tag
        id={id}
        className={`${base} ${as === 'textarea' ? 'py-2' : ''} ${error ? 'border-brick' : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        {...props}
      >
        {children}
      </Tag>
      {(error || hint) && (
        <p id={`${id}-msg`} className={`mt-1 text-sm ${error ? 'text-brick' : 'text-ink-soft'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
