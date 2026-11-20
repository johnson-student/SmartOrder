import { useState } from 'react';
import {
  useCreateCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
} from '../../api/apiSlice';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Field from '../../components/Field';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import ErrorBox from '../../components/ErrorBox';
import EmptyState from '../../components/EmptyState';
import Switch from '../../components/Switch';

function CategoryForm({ category, onClose }) {
  const [create, createState] = useCreateCategoryMutation();
  const [update, updateState] = useUpdateCategoryMutation();
  const [name, setName] = useState(category?.name ?? '');
  const [sort, setSort] = useState(String(category?.sort_order ?? 0));
  const state = category ? updateState : createState;

  const submit = async (e) => {
    e.preventDefault();
    const body = { name, sort_order: Number(sort) || 0 };
    try {
      await (category ? update({ id: category.category_id, ...body }) : create(body)).unwrap();
      onClose();
    } catch {
      /* shown below */
    }
  };

  return (
    <Modal title={category ? 'Edit category' : 'New category'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Name"
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label="Display order"
          type="number"
          min={0}
          hint="Smaller numbers appear first."
          value={sort}
          onChange={(e) => setSort(e.target.value)}
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

export default function Categories() {
  const { data, error, isLoading, refetch } = useGetCategoriesQuery();
  const [update, { error: toggleError }] = useUpdateCategoryMutation();
  const [editing, setEditing] = useState(null); // null | 'new' | category

  return (
    <>
      <PageHeader title="Menu categories" subtitle="Groups such as Drinks, Mains or Desserts.">
        <Button onClick={() => setEditing('new')}>Add category</Button>
      </PageHeader>
      {isLoading && <Spinner />}
      <ErrorBox error={error || toggleError} onRetry={refetch} />
      {data?.length === 0 && (
        <EmptyState
          title="No categories yet"
          action={<Button onClick={() => setEditing('new')}>Add your first category</Button>}
        >
          Customers see your menu grouped by category.
        </EmptyState>
      )}
      {data?.length > 0 && (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {data.map((c) => (
            <li key={c.category_id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${c.is_active ? '' : 'text-ink-soft line-through'}`}>
                  {c.name}
                </p>
                <p className="text-sm text-ink-soft">
                  Order {c.sort_order}
                  {!c.is_active && ' · Hidden from customers'}
                </p>
              </div>
              <Switch
                checked={c.is_active}
                label={`${c.name} visible to customers`}
                onChange={(v) => update({ id: c.category_id, is_active: v })}
              />
              <Button tone="secondary" size="sm" onClick={() => setEditing(c)}>
                Edit
              </Button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <CategoryForm
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
