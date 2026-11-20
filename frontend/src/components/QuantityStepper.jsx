export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label = 'Quantity',
}) {
  const btn =
    'flex h-11 w-11 items-center justify-center rounded-md border border-line bg-white text-xl font-bold hover:bg-lagoon-tint disabled:opacity-40';
  return (
    <div className="inline-flex items-center gap-1" role="group" aria-label={label}>
      <button
        type="button"
        className={btn}
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <output className="num w-9 text-center text-lg font-bold" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className={btn}
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
