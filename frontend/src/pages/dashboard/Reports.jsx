import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetReportSummaryQuery } from '../../api/apiSlice';
import { formatMoney, shiftDate, todayString } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Field from '../../components/Field';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import ErrorBox from '../../components/ErrorBox';

export function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
      <p className="num text-3xl font-extrabold">{value}</p>
    </div>
  );
}

export default function Reports() {
  const currency = useSelector((s) => s.auth.restaurant?.currency) || 'USD';
  const today = todayString();
  const [range, setRange] = useState({ from: shiftDate(today, -6), to: today });
  const { data, error, isFetching, refetch } = useGetReportSummaryQuery(range);
  const money = (v) => formatMoney(v, currency);
  const maxDay = Math.max(1, ...(data?.by_day ?? []).map((d) => Number(d.sales_total)));

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Sales and best sellers. Cancelled orders are not counted as sales."
      />
      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-white p-4">
        <Field
          label="From"
          type="date"
          value={range.from}
          max={range.to}
          onChange={(e) => setRange({ ...range, from: e.target.value })}
        />
        <Field
          label="To"
          type="date"
          value={range.to}
          min={range.from}
          max={today}
          onChange={(e) => setRange({ ...range, to: e.target.value })}
        />
        <div className="flex gap-2">
          <Button tone="secondary" onClick={() => setRange({ from: today, to: today })}>
            Today
          </Button>
          <Button
            tone="secondary"
            onClick={() => setRange({ from: shiftDate(today, -6), to: today })}
          >
            Last 7 days
          </Button>
          <Button
            tone="secondary"
            onClick={() => setRange({ from: shiftDate(today, -29), to: today })}
          >
            Last 30 days
          </Button>
        </div>
      </div>

      <ErrorBox error={error} onRetry={refetch} />
      {isFetching && !data && <Spinner />}
      {data && (
        <div className={isFetching ? 'opacity-60' : ''}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Orders" value={data.order_count} />
            <Stat label="Sales" value={money(data.sales_total)} />
            <Stat label="Cancelled orders" value={data.cancelled_count} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section
              aria-label="Sales by day"
              className="rounded-lg border border-line bg-white p-4"
            >
              <h2 className="mb-3 text-lg font-bold">Sales by day</h2>
              <ul className="space-y-2">
                {data.by_day.map((d) => (
                  <li
                    key={d.date}
                    className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-sm"
                  >
                    <span className="num text-ink-soft">{d.date}</span>
                    <span className="h-3 rounded-full bg-paper" aria-hidden="true">
                      <span
                        className="block h-3 rounded-full bg-lagoon"
                        style={{ width: `${(Number(d.sales_total) / maxDay) * 100}%` }}
                      />
                    </span>
                    <span className="num text-right font-semibold">
                      {money(d.sales_total)}{' '}
                      <span className="font-normal text-ink-soft">· {d.order_count}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-label="Best-selling items"
              className="rounded-lg border border-line bg-white p-4"
            >
              <h2 className="mb-3 text-lg font-bold">Best-selling items</h2>
              {data.top_items.length === 0 ? (
                <p className="text-ink-soft">No sales in this period.</p>
              ) : (
                <ol className="divide-y divide-line">
                  {data.top_items.map((i, n) => (
                    <li key={i.item_id} className="flex items-center gap-3 py-2">
                      <span className="num w-6 text-ink-soft">{n + 1}</span>
                      <span className="flex-1 font-semibold">{i.name}</span>
                      <span className="num text-sm text-ink-soft">{i.quantity} sold</span>
                      <span className="num w-24 text-right font-semibold">{money(i.revenue)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
