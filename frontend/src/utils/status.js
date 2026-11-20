export const STATUS = {
  PENDING: { label: 'Pending', tone: 'bg-saffron-tint text-saffron' },
  PREPARING: { label: 'Preparing', tone: 'bg-lagoon-tint text-lagoon-dark' },
  READY: { label: 'Ready', tone: 'bg-leaf-tint text-leaf' },
  COMPLETED: { label: 'Completed', tone: 'bg-line text-ink-soft' },
  CANCELLED: { label: 'Cancelled', tone: 'bg-brick-tint text-brick' },
};

// What a staff member can do next (mirrors the backend rules; the backend is the real judge).
export const NEXT_ACTION = {
  PENDING: { status: 'PREPARING', label: 'Start preparing' },
  PREPARING: { status: 'READY', label: 'Mark ready' },
  READY: { status: 'COMPLETED', label: 'Complete order' },
};

export const CAN_CANCEL = ['PENDING', 'PREPARING', 'READY'];
