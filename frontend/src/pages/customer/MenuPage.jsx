import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useGetPublicMenuQuery } from '../../api/apiSlice';
import { addItem, selectCartCount, selectCartTotalCents } from '../../features/cart/cartSlice';
import { errorCode, formatMoney, fromCents } from '../../utils/format';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import ErrorBox from '../../components/ErrorBox';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Field from '../../components/Field';
import QuantityStepper from '../../components/QuantityStepper';

function ItemSheet({ item, currency, onAdd, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  return (
    <Modal title={item.name} onClose={onClose}>
      {item.image_url && (
        <img src={item.image_url} alt="" className="mb-3 h-44 w-full rounded-md object-cover" />
      )}
      {item.description && <p className="mb-4 text-ink-soft">{item.description}</p>}
      <p className="num mb-4 text-xl font-bold">{formatMoney(item.price, currency)}</p>
      <Field
        label="Note for the kitchen (optional)"
        value={notes}
        maxLength={255}
        placeholder="For example: no ice"
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="mt-5 flex items-center justify-between gap-4">
        <QuantityStepper value={quantity} onChange={setQuantity} />
        <Button className="flex-1" onClick={() => onAdd(quantity, notes)}>
          Add · <span className="num">{formatMoney(Number(item.price) * quantity, currency)}</span>
        </Button>
      </div>
    </Modal>
  );
}

export default function MenuPage() {
  const { qrToken } = useParams();
  const dispatch = useDispatch();
  const { data, error, isLoading, refetch } = useGetPublicMenuQuery(qrToken);
  const cart = useSelector((s) => s.cart);
  const count = useSelector(selectCartCount);
  const totalCents = useSelector(selectCartTotalCents);
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  // Remember this table so the tracking page can offer "Order more".
  useEffect(() => {
    try {
      localStorage.setItem('smartqr.lastMenu', qrToken);
    } catch {
      /* ignore */
    }
  }, [qrToken]);

  const categories = useMemo(() => data?.categories ?? [], [data]);

  // Highlight the category chip that is on screen.
  useEffect(() => {
    if (!categories.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveCategory(visible.target.dataset.cat);
      },
      { rootMargin: '-120px 0px -65% 0px' },
    );
    categories.forEach((c) => {
      const el = document.getElementById(`cat-${c.category_id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories]);

  if (isLoading) return <Spinner label="Loading the menu" fullPage />;
  if (error) {
    const invalid = errorCode(error) === 'QR_INVALID';
    return (
      <main className="mx-auto max-w-md px-5 py-10">
        {invalid ? (
          <EmptyState
            title="This QR code is not valid anymore"
            action={
              <Link to="/scan" className="font-semibold text-lagoon-dark underline">
                Scan again
              </Link>
            }
          >
            It may have been replaced. Please scan the code on your table again, or ask the staff
            for help.
          </EmptyState>
        ) : (
          <ErrorBox error={error} onRetry={refetch} />
        )}
      </main>
    );
  }

  const { restaurant, table } = data;
  const inCart = cart.qrToken === qrToken && count > 0;

  const scrollTo = (id) =>
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="mx-auto min-h-screen max-w-2xl pb-28">
      <header className="bg-lagoon px-5 pb-5 pt-6 text-white">
        <p className="text-sm font-semibold uppercase tracking-widest opacity-80">
          Table {table.table_number}
        </p>
        <h1 className="text-3xl font-extrabold">{restaurant.name}</h1>
      </header>

      {categories.length > 0 && (
        <nav
          aria-label="Menu categories"
          className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur"
        >
          <ul className="flex gap-2 overflow-x-auto px-4 py-3">
            {categories.map((c) => (
              <li key={c.category_id}>
                <button
                  type="button"
                  onClick={() => scrollTo(c.category_id)}
                  aria-current={String(c.category_id) === activeCategory}
                  className={`min-h-10 whitespace-nowrap rounded-full border px-4 font-semibold ${
                    String(c.category_id) === activeCategory
                      ? 'border-lagoon bg-lagoon text-white'
                      : 'border-line bg-white'
                  }`}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <main className="px-4 pt-4">
        {categories.length === 0 && (
          <EmptyState title="The menu is empty">
            The restaurant has not added any dishes yet.
          </EmptyState>
        )}
        {categories.map((c) => (
          <section
            key={c.category_id}
            id={`cat-${c.category_id}`}
            data-cat={c.category_id}
            className="mb-8 scroll-mt-20"
          >
            <h2 className="mb-2 text-xl font-bold">{c.name}</h2>
            <ul className="divide-y divide-line rounded-lg border border-line bg-white">
              {c.items.map((item) => (
                <li key={item.item_id}>
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-lagoon-tint/50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{item.name}</span>
                      {item.description && (
                        <span className="line-clamp-2 block text-sm text-ink-soft">
                          {item.description}
                        </span>
                      )}
                      <span className="num mt-1 block font-bold text-lagoon-dark">
                        {formatMoney(item.price, restaurant.currency)}
                      </span>
                    </span>
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt=""
                        loading="lazy"
                        className="h-16 w-16 shrink-0 rounded-md object-cover"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lagoon text-2xl text-white"
                    >
                      +
                    </span>
                    <span className="sr-only">Add {item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      {inCart && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Link
            to={`/menu/${qrToken}/cart`}
            className="mx-auto flex min-h-12 max-w-2xl items-center justify-between rounded-md bg-lagoon px-5 font-bold text-white hover:bg-lagoon-dark"
          >
            <span>View cart ({count})</span>
            <span className="num">{formatMoney(fromCents(totalCents), restaurant.currency)}</span>
          </Link>
        </div>
      )}

      {selected && (
        <ItemSheet
          item={selected}
          currency={restaurant.currency}
          onClose={() => setSelected(null)}
          onAdd={(quantity, notes) => {
            dispatch(
              addItem({ qrToken, currency: restaurant.currency, item: selected, quantity, notes }),
            );
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
