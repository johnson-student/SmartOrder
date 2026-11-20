import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation, useRegisterMutation } from '../api/apiSlice';
import { setCredentials } from '../features/auth/authSlice';
import Button from '../components/Button';
import ErrorBox from '../components/ErrorBox';
import Field from '../components/Field';

function Shell({ title, subtitle, children, footer }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <Link to="/" className="text-sm font-bold uppercase tracking-widest text-lagoon">
        SmartQR
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold">{title}</h1>
      <p className="mb-6 mt-1 text-ink-soft">{subtitle}</p>
      <div className="rounded-lg border border-line bg-white p-5">{children}</div>
      <p className="mt-4 text-center text-ink-soft">{footer}</p>
    </main>
  );
}

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useSelector((s) => s.auth.token);
  const [form, setForm] = useState({ email: '', password: '' });
  const [login, { isLoading, error }] = useLoginMutation();

  if (token) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    try {
      const result = await login(form).unwrap();
      dispatch(setCredentials(result));
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch {
      /* shown below */
    }
  };

  return (
    <Shell
      title="Staff sign in"
      subtitle="Sign in to see and manage your restaurant’s orders."
      footer={
        <>
          New restaurant?{' '}
          <Link to="/register" className="font-semibold text-lagoon-dark underline">
            Create a workspace
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <ErrorBox error={error} />
        <Button type="submit" className="w-full" loading={isLoading}>
          Sign in
        </Button>
      </form>
    </Shell>
  );
}

const CURRENCIES = ['USD', 'KHR', 'EUR', 'GBP', 'THB', 'VND', 'SGD', 'AUD', 'JPY'];

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((s) => s.auth.token);
  const [register, { isLoading, error }] = useRegisterMutation();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    restaurant_name: '',
    currency: 'USD',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Phnom_Penh',
  });
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  if (token) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    try {
      const result = await register(form).unwrap();
      dispatch(setCredentials(result));
      navigate('/dashboard', { replace: true });
    } catch {
      /* shown below */
    }
  };

  return (
    <Shell
      title="Set up your restaurant"
      subtitle="Create the owner account and your restaurant workspace."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/staff/login" className="font-semibold text-lagoon-dark underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field
          label="Your name"
          autoComplete="name"
          required
          value={form.full_name}
          onChange={set('full_name')}
        />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={set('email')}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters."
          value={form.password}
          onChange={set('password')}
        />
        <Field
          label="Restaurant name"
          required
          value={form.restaurant_name}
          onChange={set('restaurant_name')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field as="select" label="Currency" value={form.currency} onChange={set('currency')}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Field>
          <Field
            label="Time zone"
            value={form.timezone}
            onChange={set('timezone')}
            hint="Used for daily reports."
          />
        </div>
        <ErrorBox error={error} />
        <Button type="submit" className="w-full" loading={isLoading}>
          Create restaurant
        </Button>
      </form>
    </Shell>
  );
}
