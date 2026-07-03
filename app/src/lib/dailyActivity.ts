type DailyActivitySnapshot = {
  buyerRequests: number;
  activeGroupBuys: number;
  pickupWindows: number;
  businessCategories: number;
  privateGroupRequests: number;
};

function seededNumber(seed: number, min: number, max: number) {
  const x = Math.sin(seed) * 10000;
  const fraction = x - Math.floor(x);
  return Math.floor(fraction * (max - min + 1)) + min;
}

export function getDailyActivitySnapshot(date = new Date()): DailyActivitySnapshot {
  const dateKey = Number(
    `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
      date.getDate(),
    ).padStart(2, "0")}`,
  );

  return {
    buyerRequests: seededNumber(dateKey + 11, 14, 38),
    activeGroupBuys: seededNumber(dateKey + 23, 3, 8),
    pickupWindows: seededNumber(dateKey + 37, 5, 14),
    businessCategories: seededNumber(dateKey + 41, 4, 7),
    privateGroupRequests: seededNumber(dateKey + 53, 2, 9),
  };
}
