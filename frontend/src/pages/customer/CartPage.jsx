import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useCreateOrderMutation } from '../../api/apiSlice';
import {
  clearCart,
  removeItems,
  removeLine,
  selectCartTotalCents,
  setNote,
  setQuantity,
} from '../../features/cart/cartSlice';
import { errorCode, errorMessage, formatMoney, fromCents, toCents } from '../../utils/format';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ErrorBox from '../../components/ErrorBox';
import Field from '../../components/Field';
import QuantityStepper from '../../components/QuantityStepper';

export default function CartPage() {
  const { qrToken } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((s) => s.cart);
  const totalCents = useSelector(selectCartTotalCents);
  const [createOrder, { isLoading, error, reset }] = useCreateOrderMutation();

  const lines = cart.qrToken === qrToken ? cart.lines : [];
  const money = (v) => formatMoney(v, cart.currency);

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-md px-5 py-10">
        <EmptyState
          title="Your cart is empty"
          action={
            <Link to={`/menu/${qrToken}`} className="font-semibold text-lagoon-dark underline">
              Back to the menu
            </Link>
          }
        >
          Add a few dishes from the menu to place an order.
        </EmptyState>
      </main>
    );
  }

  const submit = async () => {
    try {
      const order = await createOrder({
        qr_token: qrToken,
        client_request_id: cart.requestId, // same id on a retry = no duplicate order
        customer_note: cart.note || undefined,
        items: lines.map((l) => ({
          item_id: l.item_id,
          quantity: l.quantity,
          notes: l.notes || undefined,
        })),
      }).unwrap();
      try {
        localStorage.setItem('smartqr.lastOrder', order.public_token);
      } catch {
        /* ignore */
      }
      dispatch(clearCart());
      navigate(`/order/${order.public_token}`, { replace: true });
    } catch {
      /* the error is shown below */
    }
  };

  const unavailable =
    errorCode(error) === 'ITEM_UNAVAILABLE' ? error.data.error.details?.item_ids : null;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-32 pt-5">
      <Link to={`/menu/${qrToken}`} className="font-semibold text-lagoon-dark">
        ← Back to menu
      </Link>
      <h1 className="mb-4 mt-2 text-2xl font-bold">Your order</h1>

      <ul className="divide-y divide-line rounded-lg border border-line bg-white">
        {lines.map((l) => (
          <li
            key={l.key}
            className={`px-4 py-3 ${unavailable?.includes(l.item_id) ? 'bg-brick-tint' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{l.name}</p>
                {l.notes && <p className="text-sm italic text-ink-soft">“{l.notes}”</p>}
                {unavailable?.includes(l.item_id) && (
                  <p className="text-sm font-semibold text-brick">No longer available</p>
                )}
              </div>
              <p className="num font-bold">{money(fromCents(toCents(l.price) * l.quantity))}</p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <QuantityStepper
                value={l.quantity}
                label={`Quantity of ${l.name}`}
                onChange={(q) => dispatch(setQuantity({ key: l.key, quantity: q }))}
              />
              <Button tone="ghost" size="sm" onClick={() => dispatch(removeLine(l.key))}>
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Field
        as="textarea"
        rows={2}
        className="mt-4"
        label="Note for the whole order (optional)"
        value={cart.note}
        maxLength={255}
        onChange={(e) => dispatch(setNote(e.target.value))}
      />

      <div className="mt-4 space-y-3">
        {error && (
          <ErrorBox
            message={
              unavailable
                ? 'Some dishes are not available anymore. Remove them and try again.'
                : errorMessage(error)
            }
          />
        )}
        {unavailable && (
          <Button
            tone="secondary"
            onClick={() => {
              dispatch(removeItems(unavailable));
              reset();
            }}
          >
            Remove unavailable dishes
          </Button>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 flex items-center justify-between px-1 text-lg">
            <span className="font-semibold">Total</span>
            <span className="num text-xl font-extrabold">{money(fromCents(totalCents))}</span>
          </div>
          <Button className="w-full" loading={isLoading} onClick={submit}>
            Place order
          </Button>
          <p className="mt-1 text-center text-xs text-ink-soft">
            You pay at the counter. The final price is confirmed by the restaurant’s menu.
          </p>
        </div>
      </div>
    </main>
  );
}
