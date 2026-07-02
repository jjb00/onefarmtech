import { statusBadgeClass } from "@/lib/status";

type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
        status
      )}`}
    >
      {status}
    </span>
  );
}
