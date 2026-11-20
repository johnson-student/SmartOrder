import { Link } from 'react-router-dom';

function lastOrder() {
  try {
    return localStorage.getItem('smartqr.lastOrder');
  } catch {
    return null;
  }
}

export default function Home() {
  const last = lastOrder();
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <p className="text-sm font-bold uppercase tracking-widest text-lagoon">SmartQR</p>
      <h1 className="mt-2 text-4xl font-extrabold">Scan. Order. Enjoy.</h1>
      <p className="mt-3 text-lg text-ink-soft">
        Scan the QR code on your table to see the menu and order from your seat. No app and no
        account needed.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          to="/scan"
          className="flex min-h-12 items-center justify-center rounded-md bg-lagoon px-4 font-bold text-white hover:bg-lagoon-dark"
        >
          Scan a table QR code
        </Link>
        {last && (
          <Link
            to={`/order/${last}`}
            className="flex min-h-12 items-center justify-center rounded-md border border-line bg-white px-4 font-semibold hover:bg-lagoon-tint"
          >
            Open my last order
          </Link>
        )}
      </div>

      <hr className="my-10 border-line" />
      <p className="text-sm text-ink-soft">Restaurant owner or staff?</p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-semibold text-lagoon-dark">
        <Link to="/staff/login" className="underline">
          Sign in
        </Link>
        <Link to="/register" className="underline">
          Set up your restaurant
        </Link>
      </div>
    </main>
  );
}
