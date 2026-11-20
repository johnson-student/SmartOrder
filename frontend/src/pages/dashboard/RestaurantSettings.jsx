import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useGetRestaurantQuery, useUpdateRestaurantMutation } from '../../api/apiSlice';
import { showToast } from '../../features/ui/toastSlice';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Field from '../../components/Field';
import Spinner from '../../components/Spinner';
import ErrorBox from '../../components/ErrorBox';

const CURRENCIES = ['USD', 'KHR', 'EUR', 'GBP', 'THB', 'VND', 'SGD', 'AUD', 'JPY'];

function SettingsForm({ restaurant }) {
  const dispatch = useDispatch();
  const [update, { isLoading: saving, error: saveError }] = useUpdateRestaurantMutation();
  const [form, setForm] = useState({
    name: restaurant.name,
    address: restaurant.address ?? '',
    phone: restaurant.phone ?? '',
    currency: restaurant.currency,
    timezone: restaurant.timezone,
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await update({
        ...form,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
      }).unwrap();
      dispatch(showToast('Restaurant details saved.', 'success'));
    } catch {
      /* shown below */
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-line bg-white p-5">
      <Field label="Restaurant name" required value={form.name} onChange={set('name')} />
      <Field label="Address" value={form.address} onChange={set('address')} />
      <Field label="Phone" type="tel" value={form.phone} onChange={set('phone')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field as="select" label="Currency" value={form.currency} onChange={set('currency')}>
          {[...new Set([form.currency, ...CURRENCIES])].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Field>
        <Field
          label="Time zone"
          value={form.timezone}
          onChange={set('timezone')}
          hint="Daily reports use this time zone."
        />
      </div>
      <ErrorBox error={saveError} />
      <Button type="submit" loading={saving}>
        Save changes
      </Button>
    </form>
  );
}

export default function RestaurantSettings() {
  const { data, error, isLoading, refetch } = useGetRestaurantQuery();
  return (
    <div className="max-w-xl">
      <PageHeader title="Restaurant" subtitle="Basic information about your restaurant." />
      {isLoading && <Spinner />}
      <ErrorBox error={error} onRetry={refetch} />
      {data && <SettingsForm restaurant={data} />}
    </div>
  );
}
