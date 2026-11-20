import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useCreateMenuItemMutation,
  useGetCategoriesQuery,
  useGetMenuItemsQuery,
  useUpdateMenuItemMutation,
} from '../../api/apiSlice';
import { formatMoney } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Field from '../../components/Field';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import ErrorBox from '../../components/ErrorBox';
import EmptyState from '../../components/EmptyState';
import Switch from '../../components/Switch';

function ItemForm({ item, categories, onClose }) {
  const [create, createState] = useCreateMenuItemMutation();
  const [update, updateState] = useUpdateMenuItemMutation();
  const state = item ? updateState : createState;
  const [form, setForm] = useState({
    name: item?.name ?? '',
    category_id: String(item?.category_id ?? categories[0]?.category_id ?? ''),
    price: item?.price ?? '',
    description: item?.description ?? '',
    image_url: item?.image_url ?? '',
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const body = {
      name: form.name,
      category_id: Number(form.category_id),
      price: form.price,
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
    };
    try {
      await (item ? update({ id: item.item_id, ...body }) : create(body)).unwrap();
      onClose();
    } catch {
      /* shown below */
    }
  };

  return (
    <Modal title={item ? 'Edit menu item' : 'New menu item'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" required maxLength={120} value={form.name} onChange={set('name')} />
        <Field
          as="select"
          label="Category"
          required
          value={form.category_id}
          onChange={set('category_id')}
        >
          {categories.map((c) => (
            <option key={c.category_id} value={c.category_id}>
              {c.name}
              {c.is_active ? '' : ' (hidden)'}
            </option>
          ))}
        </Field>
        <Field
          label="Price"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
          value={form.price}
          onChange={set('price')}
        />
        <Field
          as="textarea"
          rows={3}
          label="Description (optional)"
          maxLength={2000}
          value={form.description}
          onChange={set('description')}
        />
        <Field
          label="Photo link (optional)"
          type="url"
          placeholder="https://…"
          value={form.image_url}
          onChange={set('image_url')}
          hint="A link to an image on the internet."
        />
        <ErrorBox error={state.error} />
        <div className="flex justify-end gap-2">
          <Button tone="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={state.isLoading}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function MenuItems() {
  const currency = useSelector((s) => s.auth.restaurant?.currency) || 'USD';
  const items = useGetMenuItemsQuery();
  const cats = useGetCategoriesQuery();
  const [update, { error: toggleError }] = useUpdateMenuItemMutation();
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('');

  const categories = cats.data ?? [];
  const list = (items.data ?? []).filter((i) => !filter || String(i.category_id) === filter);
  const catName = (id) => categories.find((c) => c.category_id === id)?.name ?? '';

  return (
    <>
      <PageHeader title="Menu items" subtitle="Dishes and drinks customers can order.">
        <Button onClick={() => setEditing('new')} disabled={categories.length === 0}>
          Add item
        </Button>
      </PageHeader>
      {(items.isLoading || cats.isLoading) && <Spinner />}
      <ErrorBox error={items.error || cats.error || toggleError} onRetry={items.refetch} />

      {cats.data && categories.length === 0 && (
        <EmptyState title="Create a category first">Menu items live inside categories.</EmptyState>
      )}
      {categories.length > 0 && (
        <>
          <div className="mb-4 max-w-xs">
            <Field
              as="select"
              label="Category"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.name}
                </option>
              ))}
            </Field>
          </div>
          {items.data && list.length === 0 && (
            <EmptyState
              title="No items here yet"
              action={<Button onClick={() => setEditing('new')}>Add an item</Button>}
            />
          )}
          {list.length > 0 && (
            <ul className="divide-y divide-line rounded-lg border border-line bg-white">
              {list.map((i) => (
                <li
                  key={i.item_id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
                >
                  <div className="min-w-0 flex-1 basis-48">
                    <p
                      className={`font-semibold ${i.is_active ? '' : 'text-ink-soft line-through'}`}
                    >
                      {i.name}
                    </p>
                    <p className="text-sm text-ink-soft">
                      {catName(i.category_id)} ·{' '}
                      <span className="num">{formatMoney(i.price, currency)}</span>
                      {!i.is_active && ' · Removed'}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <Switch
                      checked={i.is_available}
                      disabled={!i.is_active}
                      label={`${i.name} available`}
                      onChange={(v) => update({ id: i.item_id, is_available: v })}
                    />
                    {i.is_available ? 'Available' : 'Sold out'}
                  </label>
                  <Button tone="secondary" size="sm" onClick={() => setEditing(i)}>
                    Edit
                  </Button>
                  {i.is_active ? (
                    <Button
                      tone="ghost"
                      size="sm"
                      onClick={() => update({ id: i.item_id, is_active: false })}
                    >
                      Remove
                    </Button>
                  ) : (
                    <Button
                      tone="ghost"
                      size="sm"
                      onClick={() => update({ id: i.item_id, is_active: true })}
                    >
                      Restore
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {editing && (
        <ItemForm
          item={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
