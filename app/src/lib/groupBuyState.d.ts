export type GroupBuyReservationState = {
  paymentStatus?: string | null;
  quantity?: number | null;
};

export type GroupBuyStateInput = {
  currentStatus?: string | null;
  requestedStatus?: string;
  minQuantity?: number | null;
  targetQuantity?: number | null;
  fulfilmentStatus?: string | null;
  reservations?: GroupBuyReservationState[];
};

export type DerivedGroupBuyState = {
  status: string;
  paymentStatus: string;
  reservedQuantity: number;
  minimumMet: boolean;
  targetMet: boolean;
};

export function isPaidGroupBuyReservationStatus(
  status?: string | null,
): boolean;

export function paidGroupBuyQuantity(
  reservations?: GroupBuyReservationState[],
): number;

export function deriveGroupBuyState(
  input: GroupBuyStateInput,
): DerivedGroupBuyState;
