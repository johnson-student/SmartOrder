import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetOrdersQuery } from '../../api/apiSlice';
import { formatDateTime, formatMoney } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Field from '../../components/Field';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import ErrorBox from '../../components/ErrorBox';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';

const FILTERS = [
  { value: 'COMPLETED,CANCELLED', label: 'Completed and cancelled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'ALL', label: 'All orders' },
];

export default function History() {
  const currency = useSelector((s) => s.auth.restaurant?.currency) || 'USD';
  const [filters, setFilters] = useState({ status: 'COMPLETED,CANCELLED', from: '', to: '' });
  const [page, setPage] = useState(1);

  const params = { page, limit: 20 };
  if (filters.status !== 'ALL') params.status = filters.status;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  const { data, error, isFetching, refetch } = useGetOrdersQuery(params);

  const change = (key) => (e) => {
    setFilters({ ...filters, [key]: e.target.value });
    setPage(1);
  };
  const orders = data?.data ?? [];
  const meta = data?.meta;

  return (
    <>
      <PageHeader title="Order history" subtitle="Find any past order." />
      <div className="mb-4 grid gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-3">
        <Field as="select" label="Show" value={filters.status} onChange={change('status')}>
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Field>
        <Field
          label="From date"
          type="date"
          value={filters.from}
          max={filters.to || undefined}
          onChange={change('from')}
        />
        <Field
          label="To date"
          type="date"
          value={filters.to}
          min={filters.from || undefined}
          onChange={change('to')}
        />
      </div>

      <ErrorBox error={error} onRetry={refetch} />
      {isFetching && !data && <Spinner label="Loading orders" />}
      {data && orders.length === 0 && (
        <EmptyState title="No orders found">Try a different date range or status.</EmptyState>
      )}
      {orders.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full min-w-[34rem] text-left">
            <thead className="bg-paper text-sm text-ink-soft">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Table</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.order_id} className="hover:bg-lagoon-tint/40">
                  <td className="px-4 py-3">
                    <Link
                      to={`/dashboard/orders/${o.order_id}`}
                      className="num font-bold text-lagoon-dark underline"
                    >
                      #{o.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{o.table.table_number}</td>
                  <td className="px-4 py-3 text-sm">{formatDateTime(o.created_at)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="num px-4 py-3 text-right">{formatMoney(o.total, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta && meta.total_pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button tone="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="num text-ink-soft">
            Page {meta.page} of {meta.total_pages} · {meta.total} orders
          </span>
          <Button
            tone="secondary"
            disabled={page >= meta.total_pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}
