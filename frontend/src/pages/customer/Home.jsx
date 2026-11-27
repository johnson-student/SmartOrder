import { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';

function lastOrder() {
  try {
    return localStorage.getItem('smartqr.lastOrder');
  } catch {
    return null;
  }
}

const PREVIEW_STAGES = [
  { key: 'PENDING', label: 'Pending', note: 'Ticket received by kitchen' },
  { key: 'PREPARING', label: 'Preparing', note: 'Chef is cooking your dishes' },
  { key: 'READY', label: 'Ready', note: 'Ready to bring to Table 04' },
  { key: 'SERVED', label: 'Served', note: 'Enjoy your meal!' },
];

const SAMPLE_ITEMS = [
  { qty: 2, name: 'Iced Matcha Latte', price: '$7.00', note: 'less ice' },
  { qty: 1, name: 'Fish Amok', price: '$8.50', note: 'no chili' },
  { qty: 1, name: 'Garlic Jasmine Rice', price: '$2.50', note: '' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Scan the table QR',
    description:
      'Guests point their phone camera at the QR code on their table. No app download, no sign-up, and no passwords.',
  },
  {
    step: '02',
    title: 'Browse & send order',
    description:
      'Explore live categories, add special kitchen notes per dish, and submit directly to the kitchen board.',
  },
  {
    step: '03',
    title: 'Track live updates',
    description:
      'As staff move the ticket from Pending to Preparing to Ready, the guest’s phone updates automatically.',
  },
];

const GUEST_FEATURES = [
  'Instant mobile menu from any camera app or built-in QR scanner',
  'Per-dish kitchen notes and cart persistence per table',
  'Duplicate-submit protection and server-verified order totals',
  'Private live tracking link saved automatically on the device',
];

const RESTAURANT_FEATURES = [
  'Real-time kitchen & staff order board with instant status actions',
  'Menu categories, item availability toggles, and pricing control',
  'Printable table QR codes with one-click token regeneration',
  'Daily sales summaries, top-selling items, and role-based staff access',
];

const ROLES = [
  {
    role: 'Customer',
    badge: 'No account',
    summary: 'Scan table QR, browse the menu, place orders, and follow live order status.',
  },
  {
    role: 'Staff',
    badge: 'Floor & Kitchen',
    summary: 'View incoming live orders, advance ticket statuses, and review order history.',
  },
  {
    role: 'Manager',
    badge: 'Operations',
    summary: 'Manage menus, categories, tables, printable QR codes, reports, and staff.',
  },
  {
    role: 'Owner',
    badge: 'Full Workspace',
    summary: 'Full restaurant control including manager/owner accounts and workspace settings.',
  },
];

function QrMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-lagoon"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 18v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Home() {
  const last = lastOrder();
  const [previewStatus, setPreviewStatus] = useState('PREPARING');
  const activeStage = PREVIEW_STAGES.find((s) => s.key === previewStatus) || PREVIEW_STAGES[1];
  const activeIndex = PREVIEW_STAGES.findIndex((s) => s.key === previewStatus);

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Top Navigation */}
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 font-extrabold tracking-tight text-ink">
            <QrMark />
            <span className="text-lg">SmartQR</span>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 text-sm font-semibold text-ink-soft md:flex"
          >
            <a href="#how-it-works" className="hover:text-lagoon-dark">
              How it works
            </a>
            <a href="#features" className="hover:text-lagoon-dark">
              Features
            </a>
            <a href="#roles" className="hover:text-lagoon-dark">
              Roles
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              to="/staff/login"
              className="inline-flex min-h-10 items-center justify-center rounded-md px-3 text-sm font-semibold text-lagoon-dark hover:bg-lagoon-tint"
            >
              Staff sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-lagoon px-3.5 text-sm font-bold text-white hover:bg-lagoon-dark"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-8 lg:pb-24 lg:pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-lagoon/25 bg-lagoon-tint px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-lagoon-dark">
                QR Table Ordering · Live Kitchen Sync
              </span>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Scan. Order. Enjoy.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
                Guests scan the QR code on their table, browse your live menu, and send orders
                straight to the kitchen—no app download or account required. Staff update ticket
                statuses in real time, and the guest’s phone updates by itself.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  to="/scan"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-lagoon px-6 font-bold text-white shadow-sm transition-colors hover:bg-lagoon-dark"
                >
                  Scan a table QR code
                </Link>
                <Link
                  to="/register"
                  className="inline-flex min-h-12 items-center justify-center rounded-md border border-line bg-white px-6 font-semibold text-ink transition-colors hover:bg-lagoon-tint"
                >
                  Set up your restaurant
                </Link>
                {last && (
                  <Link
                    to={`/order/${last}`}
                    className="inline-flex min-h-12 items-center justify-center rounded-md border border-lagoon/40 bg-lagoon-tint px-5 font-semibold text-lagoon-dark transition-colors hover:bg-lagoon hover:text-white"
                  >
                    Open my last order →
                  </Link>
                )}
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Guest setup
                  </dt>
                  <dd className="num mt-1 text-xl font-extrabold text-ink">0 apps</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Order updates
                  </dt>
                  <dd className="mt-1 text-xl font-extrabold text-ink">Real-time</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    QR security
                  </dt>
                  <dd className="num mt-1 text-xl font-extrabold text-ink">256-bit</dd>
                </div>
              </dl>
            </div>

            {/* Interactive Kitchen Ticket Preview */}
            <div className="lg:col-span-5">
              <div className="ticket mx-auto max-w-md shadow-sm">
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                      Live Kitchen Ticket
                    </p>
                    <p className="num mt-0.5 text-lg font-extrabold text-ink">Table 04 · #1042</p>
                  </div>
                  <StatusBadge status={previewStatus} />
                </div>

                <div className="ticket-perf px-5 py-4">
                  <ul className="space-y-3">
                    {SAMPLE_ITEMS.map((item) => (
                      <li
                        key={item.name}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-ink">
                            <span className="num mr-1.5 font-bold text-lagoon-dark">
                              {item.qty}×
                            </span>
                            {item.name}
                          </p>
                          {item.note && (
                            <p className="mt-0.5 text-xs text-ink-soft">Note: “{item.note}”</p>
                          )}
                        </div>
                        <span className="num font-semibold text-ink">{item.price}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
                    <span className="font-semibold text-ink-soft">Server-verified total</span>
                    <span className="num text-base font-extrabold text-ink">$18.00</span>
                  </div>
                </div>

                <div className="ticket-perf bg-paper/50 px-5 py-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-ink-soft">
                    <span>Guest tracker preview</span>
                    <span>{activeStage.note}</span>
                  </div>
                  <div
                    className="mt-3 grid grid-cols-4 gap-1.5"
                    role="group"
                    aria-label="Preview order status"
                  >
                    {PREVIEW_STAGES.map((stage, idx) => {
                      const isActive = stage.key === previewStatus;
                      const isDone = idx <= activeIndex;
                      return (
                        <button
                          key={stage.key}
                          type="button"
                          onClick={() => setPreviewStatus(stage.key)}
                          aria-pressed={isActive}
                          className={`min-h-9 rounded px-2 py-1 text-xs font-bold transition-colors ${
                            isActive
                              ? 'bg-lagoon text-white'
                              : isDone
                                ? 'bg-lagoon-tint text-lagoon-dark hover:bg-lagoon/20'
                                : 'border border-line bg-white text-ink-soft hover:bg-lagoon-tint'
                          }`}
                        >
                          {stage.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="border-y border-line bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-lagoon">
                How it works
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-ink">
                From table scan to kitchen ticket in seconds
              </h2>
              <p className="mt-3 text-ink-soft">
                Designed for fast dining rooms: guests order right from their seat while your team
                stays in sync on one live board.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.step} className="rounded-lg border border-line bg-paper p-6">
                  <span className="num inline-flex h-9 w-9 items-center justify-center rounded-md bg-lagoon-tint text-sm font-extrabold text-lagoon-dark">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Two-sided Features */}
        <section id="features" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-lg border border-line bg-white p-7">
              <p className="text-xs font-bold uppercase tracking-widest text-lagoon">
                For diners & guests
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-ink">
                Effortless ordering at the table
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                No sign-ups, no cluttered downloads—just a fast, clear menu tailored for phones.
              </p>
              <ul className="mt-6 space-y-3">
                {GUEST_FEATURES.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-ink">
                    <span
                      aria-hidden="true"
                      className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-lagoon"
                    />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <Link
                  to="/scan"
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-paper px-4 text-sm font-semibold text-ink hover:bg-lagoon-tint"
                >
                  Try the QR scanner →
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-white p-7">
              <p className="text-xs font-bold uppercase tracking-widest text-lagoon">
                For restaurant teams
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-ink">
                One workspace for floor, kitchen & management
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                Manage menus, generate table QR codes, and keep orders moving without paper
                bottlenecks.
              </p>
              <ul className="mt-6 space-y-3">
                {RESTAURANT_FEATURES.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-ink">
                    <span
                      aria-hidden="true"
                      className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-lagoon"
                    />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-lagoon px-4 text-sm font-bold text-white hover:bg-lagoon-dark"
                >
                  Create restaurant workspace
                </Link>
                <Link
                  to="/staff/login"
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-paper px-4 text-sm font-semibold text-ink hover:bg-lagoon-tint"
                >
                  Staff sign in
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="border-t border-line bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-lagoon">
                Built-in access control
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-ink">
                Clear permissions for every role
              </h2>
              <p className="mt-3 text-ink-soft">
                Every action is scoped to your restaurant and verified on the server.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {ROLES.map((item) => (
                <div key={item.role} className="rounded-lg border border-line bg-paper p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-extrabold text-ink">{item.role}</h3>
                    <span className="rounded-full bg-lagoon-tint px-2.5 py-0.5 text-xs font-bold text-lagoon-dark">
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="rounded-xl bg-lagoon px-6 py-10 text-white sm:px-10 sm:py-12">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <h2 className="text-2xl font-extrabold sm:text-3xl">
                  Ready to streamline table ordering?
                </h2>
                <p className="mt-2 text-sm text-lagoon-tint sm:text-base">
                  Create a restaurant workspace in under a minute, or scan a table QR code to place
                  an order right now.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex min-h-12 items-center justify-center rounded-md bg-white px-6 font-bold text-lagoon-dark transition-colors hover:bg-lagoon-tint"
                >
                  Set up your restaurant
                </Link>
                <Link
                  to="/scan"
                  className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/40 px-6 font-semibold text-white transition-colors hover:bg-lagoon-dark"
                >
                  Scan a table QR
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-8 text-sm text-ink-soft sm:flex-row sm:items-center sm:px-8">
          <div className="flex items-center gap-2 font-bold text-ink">
            <QrMark />
            <span>SmartQR</span>
            <span className="font-normal text-ink-soft">· QR-code restaurant ordering</span>
          </div>
          <div className="flex flex-wrap gap-5 font-semibold text-lagoon-dark">
            <Link to="/scan" className="hover:underline">
              Scan QR
            </Link>
            <Link to="/staff/login" className="hover:underline">
              Staff sign in
            </Link>
            <Link to="/register" className="hover:underline">
              Register restaurant
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
