export default function Loading() {
  return (
    <div className="grid gap-4 p-5" aria-label="Loading page">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-[#e8eee4]" />
      <div className="h-24 animate-pulse rounded-2xl bg-white" />
      <div className="h-64 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
