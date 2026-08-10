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

export const MAX_CONCURRENT_GROUP_BUYS: number;
export const LIVE_GROUP_BUY_STATUSES: string[];

export type GroupBuyPriceTierInput = {
  minQuantity: number;
  unitPrice: number;
};

export function resolveGroupBuyTierPrice(
  tiers: GroupBuyPriceTierInput[],
  quantity: number,
): number | null;

export function tierRefundDue(
  chargedUnitPrice: number,
  finalUnitPrice: number,
  quantity: number,
): number;
