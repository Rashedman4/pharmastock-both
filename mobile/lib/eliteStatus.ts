type T = (key: string, options?: Record<string, unknown>) => string;

function label(status: string, keys: Record<string, string>, t: T): string {
  const key = keys[status];
  return key ? t(key) : status.replace(/_/g, ' ');
}

const PLAN_STATUS_KEYS: Record<string, string> = {
  ALL: 'common.all',
  SENT: 'elite.sent',
  ACCEPTED_BY_INVESTOR: 'elite.accepted_by_investor',
  REJECTED_BY_INVESTOR: 'elite.rejected_by_investor',
  EXECUTED: 'elite.executed',
  CANCELLED: 'elite.cancelled',
  CLOSED: 'elite.closed',
  DRAFT: 'elite.draft',
};

const CLOSE_REQUEST_STATUS_KEYS: Record<string, string> = {
  PENDING: 'elite.pending',
  APPROVED: 'elite.approved',
  REJECTED: 'elite.rejected',
  CANCELLED: 'elite.cancelled',
  EXECUTED: 'elite.executed',
};

const EXECUTION_STATUS_KEYS: Record<string, string> = {
  SUBMITTED: 'elite.submitted_status',
  OPENED: 'elite.opened_status',
  CANCELLED: 'elite.cancelled',
};

const POSITION_STATUS_KEYS: Record<string, string> = {
  OPEN: 'elite.position_open',
  PARTIALLY_CLOSED: 'elite.position_partially_closed',
  PENDING_CLOSE: 'elite.position_pending_close',
  CLOSED: 'elite.closed',
};

const FIRM_PAYMENT_STATUS_KEYS: Record<string, string> = {
  PENDING: 'elite.pending',
  CHECKOUT_CREATED: 'elite.payment_checkout_created',
  AWAITING_TRANSFER: 'elite.payment_awaiting_transfer',
  PROOF_SUBMITTED: 'elite.proof_submitted',
  UNDER_REVIEW: 'elite.payment_under_review',
  PAID: 'elite.payment_paid',
  REJECTED: 'elite.rejected',
  FAILED: 'elite.payment_failed',
  EXPIRED: 'elite.payment_expired',
  CANCELLED: 'elite.cancelled',
};

export const planStatusLabel = (status: string, t: T) => label(status, PLAN_STATUS_KEYS, t);
export const closeRequestStatusLabel = (status: string, t: T) => label(status, CLOSE_REQUEST_STATUS_KEYS, t);
export const executionStatusLabel = (status: string, t: T) => label(status, EXECUTION_STATUS_KEYS, t);
export const positionStatusLabel = (status: string, t: T) => label(status, POSITION_STATUS_KEYS, t);
export const firmPaymentStatusLabel = (status: string, t: T) => label(status, FIRM_PAYMENT_STATUS_KEYS, t);
