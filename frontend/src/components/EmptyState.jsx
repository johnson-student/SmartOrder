export default function EmptyState({ title, children, action }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white px-6 py-10 text-center">
      <h3 className="text-lg font-bold">{title}</h3>
      {children && <p className="mx-auto mt-1 max-w-md text-ink-soft">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
