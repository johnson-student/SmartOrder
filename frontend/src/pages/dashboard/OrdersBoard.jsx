import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetOrdersQuery } from '../../api/apiSlice';
import useNow from '../../hooks/useNow';
import { formatMoney, timeAgo } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import ErrorBox from '../../components/ErrorBox';
import StatusBadge from '../../components/StatusBadge';
import OrderActions from './OrderActions';

const COLUMNS = [
  { status: 'PENDING', title: 'New', empty: 'No new orders.' },
  { status: 'PREPARING', title: 'Preparing', empty: 'Nothing in preparation.' },
  { status: 'READY', title: 'Ready to serve', empty: 'Nothing waiting to be served.' },
];

export function OrderTicket({ order, currency, now }) {
  return (
    <article className="ticket" aria-label={`Order ${order.order_number}`}>
      <div className="flex items-start justify-between gap-2 px-4 py-3">
        <div>
          <p className="num text-3xl font-extrabold leading-none">#{order.order_number}</p>
          <p className="mt-1 font-semibold">Table {order.table.table_number}</p>
        </div>
        <div className="text-right">
          <StatusBadge status={order.status} />
          <p className="mt-1 text-sm text-ink-soft">{timeAgo(order.created_at, now)}</p>
        </div>
      </div>
      <div className="ticket-perf px-4 py-3">
        <ul className="space-y-1">
          {order.items.map((i) => (
            <li key={i.order_item_id}>
              <span className="num font-bold">{i.quantity} ×</span> {i.name}
              {i.notes && (
                <span className="block pl-6 text-sm italic text-ink-soft">“{i.notes}”</span>
              )}
            </li>
          ))}
        </ul>
        {order.customer_note && (
          <p className="mt-2 rounded-md bg-saffron-tint px-3 py-2 text-sm font-medium text-saffron">
            Note: {order.customer_note}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="num font-bold">{formatMoney(order.total, currency)}</span>
          <Link
            to={`/dashboard/orders/${order.order_id}`}
            className="font-semibold text-lagoon-dark underline"
          >
            Details
          </Link>
        </div>
        <div className="mt-3">
          <OrderActions order={order} />
        </div>
      </div>
    </article>
  );
}

export default function OrdersBoard() {
  const currency = useSelector((s) => s.auth.restaurant?.currency) || 'USD';
  const now = useNow();
  // Polling is only a safety net. Live updates come through Socket.IO.
  const { data, error, isLoading, refetch } = useGetOrdersQuery(
    { active: true, sort: 'asc', limit: 100 },
    { pollingInterval: 60000, refetchOnFocus: true },
  );
  const orders = data?.data ?? [];

  return (
    <>
      <PageHeader title="Live orders" subtitle="New orders appear here by themselves." />
      {isLoading && <Spinner label="Loading orders" />}
      <ErrorBox error={error} onRetry={refetch} />
      {data && (
        <div className="grid gap-6 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const list = orders.filter((o) => o.status === col.status);
            return (
              <section key={col.status} aria-label={col.title}>
                <h2 className="mb-3 flex items-center justify-between text-lg font-bold">
                  {col.title}
                  <span className="num rounded-full bg-white px-3 py-0.5 text-sm text-ink-soft ring-1 ring-line">
                    {list.length}
                  </span>
                </h2>
                <div className="space-y-4">
                  {list.length === 0 && (
                    <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-ink-soft">
                      {col.empty}
                    </p>
                  )}
                  {list.map((o) => (
                    <OrderTicket key={o.order_id} order={o} currency={currency} now={now} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
