import type { DraftOrder } from "@/types/draftOrder";

const STORAGE_KEY = "onefarmtech:draft-orders";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getDraftOrders(): DraftOrder[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as DraftOrder[];
  } catch {
    return [];
  }
}

export function saveDraftOrder(order: DraftOrder) {
  if (!isBrowser()) {
    return [];
  }

  const current = getDraftOrders();
  const next = [order, ...current].slice(0, 25);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function deleteDraftOrder(id: string) {
  if (!isBrowser()) {
    return [];
  }

  const next = getDraftOrders().filter((order) => order.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearDraftOrders() {
  if (!isBrowser()) {
    return [];
  }

  window.localStorage.removeItem(STORAGE_KEY);
  return [];
}

export function countDraftOrders() {
  return getDraftOrders().length;
}
