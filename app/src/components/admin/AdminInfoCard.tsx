type AdminInfoCardProps = {
  title: string;
  description: string;
};

export default function AdminInfoCard({ title, description }: AdminInfoCardProps) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#d8e8dc]">{description}</p>
    </div>
  );
}
