import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dismissToast } from '../features/ui/toastSlice';

const TONE = {
  info: 'bg-ink text-white',
  new: 'bg-saffron text-white',
  error: 'bg-brick text-white',
  success: 'bg-leaf text-white',
};

function Toast({ toast }) {
  const dispatch = useDispatch();
  useEffect(() => {
    const id = setTimeout(() => dispatch(dismissToast(toast.id)), 6000);
    return () => clearTimeout(id);
  }, [toast.id, dispatch]);
  return (
    <div
      className={`flex items-center gap-3 rounded-md px-4 py-3 shadow-lg ${TONE[toast.tone] || TONE.info}`}
    >
      <span className="font-semibold">{toast.message}</span>
      <button
        type="button"
        onClick={() => dispatch(dismissToast(toast.id))}
        aria-label="Dismiss"
        className="ml-auto text-xl leading-none"
      >
        ×
      </button>
    </div>
  );
}

export default function ToastHost() {
  const toasts = useSelector((s) => s.toasts);
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-3 z-[60] mx-auto flex max-w-md flex-col gap-2 px-3"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} />
        </div>
      ))}
    </div>
  );
}
