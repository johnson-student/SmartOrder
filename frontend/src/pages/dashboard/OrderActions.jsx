import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useUpdateOrderStatusMutation } from '../../api/apiSlice';
import { showToast } from '../../features/ui/toastSlice';
import { errorMessage } from '../../utils/format';
import { CAN_CANCEL, NEXT_ACTION } from '../../utils/status';
import Button from '../../components/Button';
import ErrorBox from '../../components/ErrorBox';
import Field from '../../components/Field';
import Modal from '../../components/Modal';

// The buttons that move an order forward or cancel it. Used on the board and on the detail page.
export default function OrderActions({ order }) {
  const dispatch = useDispatch();
  const [update, { isLoading, error, reset }] = useUpdateOrderStatusMutation();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const next = NEXT_ACTION[order.status];

  if (!next && !CAN_CANCEL.includes(order.status)) return null;

  const run = async (body, onDone) => {
    try {
      await update({ id: order.order_id, ...body }).unwrap();
      onDone?.();
    } catch (e) {
      dispatch(showToast(errorMessage(e), 'error'));
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {next && (
          <Button
            loading={isLoading}
            onClick={() => run({ status: next.status })}
            className="flex-1"
          >
            {next.label}
          </Button>
        )}
        {CAN_CANCEL.includes(order.status) && (
          <Button
            tone="secondary"
            onClick={() => {
              reset();
              setCancelling(true);
            }}
          >
            Cancel
          </Button>
        )}
      </div>

      {cancelling && (
        <Modal title={`Cancel order #${order.order_number}?`} onClose={() => setCancelling(false)}>
          <p className="mb-3 text-ink-soft">
            The customer will see that the order was cancelled. A reason is required.
          </p>
          <Field
            as="textarea"
            rows={3}
            label="Reason"
            required
            maxLength={255}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="mt-3">
            <ErrorBox error={error} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button tone="secondary" onClick={() => setCancelling(false)}>
              Keep order
            </Button>
            <Button
              tone="danger"
              loading={isLoading}
              disabled={!reason.trim()}
              onClick={() =>
                run({ status: 'CANCELLED', reason: reason.trim() }, () => {
                  setCancelling(false);
                  setReason('');
                })
              }
            >
              Cancel order
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
