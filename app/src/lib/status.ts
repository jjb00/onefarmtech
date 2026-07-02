export function statusBadgeClass(status: string) {
  const value = status.toLowerCase();

  if (
    value.includes("paid") ||
    value.includes("approved") ||
    value.includes("verified") ||
    value.includes("trusted") ||
    value.includes("active") ||
    value.includes("resolved") ||
    value.includes("ready") ||
    value.includes("met") ||
    value.includes("completed")
  ) {
    return "bg-[#e7f3df] text-[#1f7a3f]";
  }

  if (
    value.includes("unpaid") ||
    value.includes("pending") ||
    value.includes("open") ||
    value.includes("issue") ||
    value.includes("review") ||
    value.includes("high") ||
    value.includes("limited") ||
    value.includes("preparing")
  ) {
    return "bg-[#fff1d6] text-[#8a5a00]";
  }

  if (
    value.includes("cancelled") ||
    value.includes("failed") ||
    value.includes("rejected")
  ) {
    return "bg-[#fde2e2] text-[#9f1d1d]";
  }

  return "bg-[#f7f5ec] text-[#405348]";
}
