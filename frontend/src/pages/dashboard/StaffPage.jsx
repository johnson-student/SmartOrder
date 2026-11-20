import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useCreateStaffMutation,
  useGetStaffQuery,
  useUpdateStaffMutation,
} from '../../api/apiSlice';
import { formatDateTime } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Field from '../../components/Field';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import ErrorBox from '../../components/ErrorBox';

function AddStaff({ role, onClose }) {
  const [create, { isLoading, error }] = useCreateStaffMutation();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'STAFF' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      await create(form).unwrap();
      onClose();
    } catch {
      /* shown below */
    }
  };
  return (
    <Modal title="Add a team member" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" required value={form.full_name} onChange={set('full_name')} />
        <Field label="Email" type="email" required value={form.email} onChange={set('email')} />
        <Field
          label="Temporary password"
          type="text"
          autoComplete="off"
          required
          minLength={8}
          hint="At least 8 characters. Share it privately."
          value={form.password}
          onChange={set('password')}
        />
        {role === 'OWNER' ? (
          <Field as="select" label="Role" value={form.role} onChange={set('role')}>
            <option value="STAFF">Staff: orders only</option>
            <option value="MANAGER">Manager: menu, tables, reports, staff</option>
          </Field>
        ) : (
          <p className="text-sm text-ink-soft">
            New accounts get the Staff role. Only the Owner can add Managers.
          </p>
        )}
        <ErrorBox error={error} />
        <div className="flex justify-end gap-2">
          <Button tone="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Add
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function StaffPage() {
  const myRole = useSelector((s) => s.auth.role);
  const myEmail = useSelector((s) => s.auth.user?.email);
  const { data, error, isLoading, refetch } = useGetStaffQuery();
  const [update, { error: updateError }] = useUpdateStaffMutation();
  const [adding, setAdding] = useState(false);

  // Mirrors the backend rules: Owner manages Managers and Staff; Managers manage Staff only.
  const canManage = (m) =>
    m.email !== myEmail &&
    m.role !== 'OWNER' &&
    (myRole === 'OWNER' || (myRole === 'MANAGER' && m.role === 'STAFF'));

  return (
    <>
      <PageHeader title="Staff" subtitle="People who can sign in to this restaurant.">
        <Button onClick={() => setAdding(true)}>Add team member</Button>
      </PageHeader>
      {isLoading && <Spinner />}
      <ErrorBox error={error || updateError} onRetry={refetch} />
      {data && (
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full min-w-[40rem] text-left">
            <thead className="bg-paper text-sm text-ink-soft">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Joined</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((m) => (
                <tr key={m.member_id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">
                      {m.full_name}
                      {m.email === myEmail && ' (you)'}
                    </p>
                    <p className="text-sm text-ink-soft">{m.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {myRole === 'OWNER' && canManage(m) ? (
                      <select
                        aria-label={`Role of ${m.full_name}`}
                        value={m.role}
                        onChange={(e) => update({ id: m.member_id, role: e.target.value })}
                        className="min-h-10 rounded-md border border-line bg-white px-2"
                      >
                        <option value="STAFF">Staff</option>
                        <option value="MANAGER">Manager</option>
                      </select>
                    ) : (
                      <span className="capitalize">{m.role.toLowerCase()}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${m.is_active ? 'bg-leaf-tint text-leaf' : 'bg-brick-tint text-brick'}`}
                    >
                      {m.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-soft">{formatDateTime(m.joined_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {canManage(m) && (
                      <Button
                        tone={m.is_active ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => update({ id: m.member_id, is_active: !m.is_active })}
                      >
                        {m.is_active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {adding && <AddStaff role={myRole} onClose={() => setAdding(false)} />}
    </>
  );
}
