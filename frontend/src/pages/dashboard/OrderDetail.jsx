import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetOrderQuery } from '../../api/apiSlice';
import { errorCode, formatDateTime, formatMoney } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import ErrorBox from '../../components/ErrorBox';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import OrderActions from './OrderActions';

export default function OrderDetail() {
  const { id } = useParams();
  const currency = useSelector((s) => s.auth.restaurant?.currency) || 'USD';
  const { data: order, error, isLoading, refetch } = useGetOrderQuery(id);

  if (isLoading) return <Spinner label="Loading order" />;
  if (error) {
    return errorCode(error) === 'ORDER_NOT_FOUND' ? (
      <EmptyState
        title="Order not found"
        action={
          <Link to="/dashboard/orders" className="font-semibold text-lagoon-dark underline">
            Back to live orders
          </Link>
        }
      />
    ) : (
      <ErrorBox error={error} onRetry={refetch} />
    );
  }

  return (
    <div className="max-w-3xl">
      <Link to="/dashboard/history" className="font-semibold text-lagoon-dark">
        ← Order history
      </Link>
      <PageHeader
        title={`Order #${order.order_number}`}
        subtitle={`Table ${order.table.table_number} · ${formatDateTime(order.created_at)}`}
      >
        <StatusBadge status={order.status} />
      </PageHeader>

      <section className="rounded-lg border border-line bg-white p-4" aria-label="Items">
        <table className="w-full text-left">
          <thead className="text-sm text-ink-soft">
            <tr>
              <th className="pb-2">Item</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">Price</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {order.items.map((i) => (
              <tr key={i.order_item_id}>
                <td className="py-2">
                  {i.name}
                  {i.notes && (
                    <span className="block text-sm italic text-ink-soft">“{i.notes}”</span>
                  )}
                </td>
                <td className="num py-2 text-right">{i.quantity}</td>
                <td className="num py-2 text-right">{formatMoney(i.unit_price, currency)}</td>
                <td className="num py-2 text-right">{formatMoney(i.line_total, currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line text-lg font-extrabold">
              <td className="pt-3" colSpan={3}>
                Total
              </td>
              <td className="num pt-3 text-right">{formatMoney(order.total, currency)}</td>
            </tr>
          </tfoot>
        </table>
        {order.customer_note && (
          <p className="mt-3 rounded-md bg-saffron-tint px-3 py-2 text-saffron">
            Customer note: {order.customer_note}
          </p>
        )}
      </section>

      <div className="mt-4 max-w-md">
        <OrderActions order={order} />
      </div>

      <section className="mt-6" aria-label="Status history">
        <h2 className="mb-2 text-lg font-bold">Status history</h2>
        <ol className="space-y-2 border-l-2 border-line pl-4">
          {order.history.map((h) => (
            <li key={h.history_id}>
              <StatusBadge status={h.new_status} />
              <span className="ml-2 text-sm text-ink-soft">
                {formatDateTime(h.changed_at)} · {h.changed_by || 'Customer'}
              </span>
              {h.reason && <p className="text-sm">Reason: {h.reason}</p>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
