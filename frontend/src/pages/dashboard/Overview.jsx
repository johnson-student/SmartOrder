import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetOrdersQuery, useGetReportSummaryQuery } from '../../api/apiSlice';
import { formatMoney } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import ErrorBox from '../../components/ErrorBox';
import { Stat } from './Reports';

const LINKS = [
  ['orders', 'Live orders'],
  ['menu', 'Edit the menu'],
  ['tables', 'Tables & QR codes'],
  ['staff', 'Manage staff'],
  ['reports', 'Full reports'],
];

export default function Overview() {
  const { user, restaurant } = useSelector((s) => s.auth);
  const today = useGetReportSummaryQuery({});
  const active = useGetOrdersQuery({ active: true, limit: 1 });
  const money = (v) => formatMoney(v, restaurant?.currency || 'USD');

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.full_name?.split(' ')[0] ?? ''}`}
        subtitle={`Today at ${restaurant?.name ?? ''}`}
      />
      {today.isLoading && <Spinner />}
      <ErrorBox error={today.error || active.error} />
      {today.data && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Orders in progress" value={active.data?.meta?.total ?? '–'} />
          <Stat label="Orders today" value={today.data.order_count} />
          <Stat label="Sales today" value={money(today.data.sales_total)} />
          <Stat label="Cancelled today" value={today.data.cancelled_count} />
        </div>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="mb-3 text-lg font-bold">Best sellers today</h2>
          {today.data?.top_items.length ? (
            <ol className="divide-y divide-line">
              {today.data.top_items.slice(0, 5).map((i) => (
                <li key={i.item_id} className="flex justify-between py-2">
                  <span className="font-semibold">{i.name}</span>
                  <span className="num text-ink-soft">{i.quantity} sold</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-ink-soft">No orders yet today.</p>
          )}
        </section>
        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="mb-3 text-lg font-bold">Quick links</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {LINKS.map(([to, label]) => (
              <li key={to}>
                <Link
                  to={`/dashboard/${to}`}
                  className="flex min-h-11 items-center rounded-md border border-line px-3 font-semibold hover:bg-lagoon-tint"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
