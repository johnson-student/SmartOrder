const STATUSES = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
const ACTIVE_STATUSES = ['PENDING', 'PREPARING', 'READY'];

// Report v2.0 section 14: allowed next statuses.
const TRANSITIONS = {
  PENDING: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);

module.exports = { STATUSES, ACTIVE_STATUSES, TRANSITIONS, canTransition };
