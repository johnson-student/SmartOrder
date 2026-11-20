import { useState } from 'react';
import {
  useCreateTableMutation,
  useGenerateQrMutation,
  useGetTableQrQuery,
  useGetTablesQuery,
  useUpdateTableMutation,
} from '../../api/apiSlice';
import { errorCode } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Field from '../../components/Field';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import ErrorBox from '../../components/ErrorBox';
import EmptyState from '../../components/EmptyState';

function TableForm({ table, onClose }) {
  const [create, createState] = useCreateTableMutation();
  const [update, updateState] = useUpdateTableMutation();
  const state = table ? updateState : createState;
  const [number, setNumber] = useState(table?.table_number ?? '');
  const [capacity, setCapacity] = useState(table?.capacity ? String(table.capacity) : '');

  const submit = async (e) => {
    e.preventDefault();
    const body = { table_number: number, capacity: capacity ? Number(capacity) : null };
    try {
      await (table ? update({ id: table.table_id, ...body }) : create(body)).unwrap();
      onClose();
    } catch {
      /* shown below */
    }
  };
  return (
    <Modal title={table ? 'Edit table' : 'New table'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Table number or name"
          required
          maxLength={20}
          hint="For example 5 or A2. Must be unique."
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />
        <Field
          label="Seats (optional)"
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
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

function printQr(qr) {
  const w = window.open('', '_blank', 'width=480,height=640');
  if (!w) return;
  const safe = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
    );
  w.document.write(`<!doctype html><title>Table ${safe(qr.table_number)}</title>
    <style>body{font-family:system-ui,sans-serif;text-align:center;padding:24px}img{width:320px;height:320px}h1{font-size:44px;margin:0 0 4px}p{color:#444;margin:4px 0}</style>
    <h1>Table ${safe(qr.table_number)}</h1><p>Scan to see the menu and order</p>
    <img src="${qr.image}" alt="QR code for table ${safe(qr.table_number)}"><p>No app or account needed</p>`);
  w.document.close();
  w.onload = () => {
    w.focus();
    w.print();
  };
}

function QrModal({ table, onClose }) {
  const { data: qr, error, isLoading } = useGetTableQrQuery(table.table_id);
  const [generate, genState] = useGenerateQrMutation();
  const [confirming, setConfirming] = useState(false);
  const missing = errorCode(error) === 'QR_NOT_FOUND';

  return (
    <Modal title={`Table ${table.table_number} · QR code`} onClose={onClose}>
      {isLoading && <Spinner />}
      {missing && (
        <div className="text-center">
          <p className="mb-4 text-ink-soft">This table has no QR code yet.</p>
          <Button loading={genState.isLoading} onClick={() => generate(table.table_id)}>
            Create QR code
          </Button>
        </div>
      )}
      {error && !missing && <ErrorBox error={error} />}
      {qr && (
        <div className="text-center">
          <img
            src={qr.image}
            alt={`QR code for table ${qr.table_number}`}
            className="mx-auto h-64 w-64 rounded-md border border-line"
          />
          <p className="mt-3 break-all text-sm text-ink-soft">{qr.url}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <a
              href={qr.image}
              download={`smartqr-table-${qr.table_number}.png`}
              className="inline-flex min-h-11 items-center rounded-md bg-lagoon px-4 font-semibold text-white hover:bg-lagoon-dark"
            >
              Download PNG
            </a>
            <Button tone="secondary" onClick={() => printQr(qr)}>
              Print
            </Button>
            <Button tone="secondary" onClick={() => setConfirming(true)}>
              Replace code
            </Button>
          </div>
          {confirming && (
            <div
              role="alertdialog"
              className="mt-4 rounded-md border border-saffron/40 bg-saffron-tint p-4 text-left"
            >
              <p className="font-semibold text-saffron">Replace this QR code?</p>
              <p className="mb-3 text-sm">
                The old code stops working immediately. You will need to print and place the new
                one.
              </p>
              <div className="flex gap-2">
                <Button
                  tone="danger"
                  size="sm"
                  loading={genState.isLoading}
                  onClick={async () => {
                    await generate(table.table_id);
                    setConfirming(false);
                  }}
                >
                  Yes, replace it
                </Button>
                <Button tone="secondary" size="sm" onClick={() => setConfirming(false)}>
                  Keep the old one
                </Button>
              </div>
            </div>
          )}
          <ErrorBox error={genState.error} />
        </div>
      )}
    </Modal>
  );
}

export default function Tables() {
  const { data, error, isLoading, refetch } = useGetTablesQuery();
  const [update, { error: toggleError }] = useUpdateTableMutation();
  const [editing, setEditing] = useState(null);
  const [qrFor, setQrFor] = useState(null);

  return (
    <>
      <PageHeader title="Tables & QR codes" subtitle="Each table has its own QR code.">
        <Button onClick={() => setEditing('new')}>Add table</Button>
      </PageHeader>
      {isLoading && <Spinner />}
      <ErrorBox error={error || toggleError} onRetry={refetch} />
      {data?.length === 0 && (
        <EmptyState
          title="No tables yet"
          action={<Button onClick={() => setEditing('new')}>Add your first table</Button>}
        >
          Add a table, then create its QR code.
        </EmptyState>
      )}
      {data?.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((t) => (
            <li
              key={t.table_id}
              className={`rounded-lg border border-line bg-white p-4 ${t.is_active ? '' : 'opacity-70'}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-extrabold">Table {t.table_number}</p>
                  <p className="text-sm text-ink-soft">
                    {t.capacity ? `${t.capacity} seats` : 'Seats not set'}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${t.is_active ? 'bg-leaf-tint text-leaf' : 'bg-line text-ink-soft'}`}
                >
                  {t.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <p
                className={`mt-2 text-sm font-semibold ${t.has_active_qr ? 'text-leaf' : 'text-saffron'}`}
              >
                {t.has_active_qr ? '✓ QR code ready' : 'No QR code yet'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled={!t.is_active} onClick={() => setQrFor(t)}>
                  {t.has_active_qr ? 'View QR' : 'Create QR'}
                </Button>
                <Button tone="secondary" size="sm" onClick={() => setEditing(t)}>
                  Edit
                </Button>
                <Button
                  tone="ghost"
                  size="sm"
                  onClick={() => update({ id: t.table_id, is_active: !t.is_active })}
                >
                  {t.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <TableForm table={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
      {qrFor && <QrModal table={qrFor} onClose={() => setQrFor(null)} />}
    </>
  );
}
