import { Link, useParams } from 'react-router-dom';
import { useGetTrackedOrderQuery } from '../../api/apiSlice';
import useOrderTracking from '../../hooks/useOrderTracking';
import { errorCode, formatMoney, formatTime } from '../../utils/format';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import ErrorBox from '../../components/ErrorBox';

const STEPS = [
  { status: 'PENDING', label: 'Order received', hint: 'The restaurant has your order.' },
  { status: 'PREPARING', label: 'Preparing', hint: 'The kitchen is making it.' },
  { status: 'READY', label: 'Ready', hint: 'Your order is ready.' },
  { status: 'COMPLETED', label: 'Completed', hint: 'Enjoy your meal!' },
];

export default function TrackPage() {
  const { orderToken } = useParams();
  const { data: order, error, isLoading, refetch } = useGetTrackedOrderQuery(orderToken);
  const live = useOrderTracking(orderToken);

  if (isLoading) return <Spinner label="Loading your order" fullPage />;
  if (error) {
    return (
      <main className="mx-auto max-w-md px-5 py-10">
        {errorCode(error) === 'ORDER_NOT_FOUND' ? (
          <EmptyState
            title="We cannot find this order"
            action={
              <Link to="/" className="font-semibold text-lagoon-dark underline">
                Go to the start page
              </Link>
            }
          >
            Check that the link is complete.
          </EmptyState>
        ) : (
          <ErrorBox error={error} onRetry={refetch} />
        )}
      </main>
    );
  }

  const cancelled = order.status === 'CANCELLED';
  const currentIndex = STEPS.findIndex((s) => s.status === order.status);
  const timeOf = (status) => order.history.find((h) => h.status === status)?.at;
  let lastMenu = null;
  try {
    lastMenu = localStorage.getItem('smartqr.lastMenu');
  } catch {
    /* ignore */
  }
  const money = (v) => formatMoney(v, order.restaurant.currency);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-6">
      <p className="text-sm font-bold uppercase tracking-widest text-lagoon">
        {order.restaurant.name}
      </p>

      <div className="ticket mt-3">
        <div className="px-5 py-5 text-center">
          <p className="text-sm font-semibold text-ink-soft">Your order number</p>
          <p className="num text-6xl font-extrabold">#{order.order_number}</p>
          <p className="mt-1 text-ink-soft">Table {order.table_number}</p>
        </div>
        <div className="ticket-perf px-5 py-5">
          {cancelled ? (
            <div
              role="status"
              className="rounded-md bg-brick-tint px-4 py-3 text-center font-bold text-brick"
            >
              This order was cancelled. Please ask the staff if you have questions.
            </div>
          ) : (
            <ol className="space-y-4" aria-label="Order progress">
              {STEPS.map((step, i) => {
                const done = i < currentIndex || order.status === 'COMPLETED';
                const current = i === currentIndex && order.status !== 'COMPLETED';
                const at = timeOf(step.status);
                return (
                  <li
                    key={step.status}
                    className="flex gap-3"
                    aria-current={current ? 'step' : undefined}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                        done
                          ? 'border-lagoon bg-lagoon text-white'
                          : current
                            ? 'border-lagoon bg-lagoon-tint text-lagoon-dark'
                            : 'border-line text-ink-soft'
                      }`}
                    >
                      {done ? '✓' : i + 1}
                    </span>
                    <span className="flex-1">
                      <span className={`block font-bold ${done || current ? '' : 'text-ink-soft'}`}>
                        {step.label}
                        {current && <span className="sr-only"> (current step)</span>}
                      </span>
                      {current && <span className="block text-sm text-ink-soft">{step.hint}</span>}
                    </span>
                    {at && <span className="num text-sm text-ink-soft">{formatTime(at)}</span>}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      <section
        className="mt-5 rounded-lg border border-line bg-white p-4"
        aria-label="Order details"
      >
        <ul className="divide-y divide-line">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3 py-2">
              <span>
                <span className="num font-semibold">{item.quantity} ×</span> {item.name}
                {item.notes && (
                  <span className="block text-sm italic text-ink-soft">“{item.notes}”</span>
                )}
              </span>
              <span className="num">{money(item.line_total)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex justify-between border-t border-line pt-3 text-lg font-extrabold">
          <span>Total</span>
          <span className="num">{money(order.total)}</span>
        </p>
        <p className="mt-1 text-sm text-ink-soft">Pay at the counter.</p>
      </section>

      <p className="mt-4 text-sm text-ink-soft" role="status">
        {live
          ? 'This page updates by itself. You can keep it open.'
          : 'Reconnecting to live updates… You can also refresh this page.'}
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        Save this page’s link to come back to your order later.
      </p>

      {lastMenu && (
        <Link
          to={`/menu/${lastMenu}`}
          className="mt-5 flex min-h-12 items-center justify-center rounded-md border border-line bg-white font-semibold hover:bg-lagoon-tint"
        >
          Order more
        </Link>
      )}
    </main>
  );
}
