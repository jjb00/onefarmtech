import AdminLayoutFrame from "@/components/admin/AdminLayoutFrame";

type AdminPageShellProps = {
  title: string;
  description: string;
  actionLabel?: string;
  children: React.ReactNode;
};

export default function AdminPageShell({
  title,
  description,
  actionLabel = "Add new",
  children,
}: AdminPageShellProps) {
  return (
    <AdminLayoutFrame
      title={title}
      description={description}
      action={
        <button className="rounded-full bg-[#9ee6ad] px-6 py-4 font-semibold text-[#102015]">
          {actionLabel}
        </button>
      }
    >
      {children}
    </AdminLayoutFrame>
  );
}
