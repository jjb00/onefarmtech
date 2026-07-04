type StatCardProps = {
  label: string;
  value: string;
};

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6">
      <p className="text-sm text-[#d8e8dc]">{label}</p>
      <p className="mt-2 text-4xl font-bold">{value}</p>
    </div>
  );
}
