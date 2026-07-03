import Link from "next/link";
import AdminLayoutFrame from "@/components/admin/AdminLayoutFrame";

type AdminPageShellProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
};

export default function AdminPageShell({
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: AdminPageShellProps) {
  const action =
    actionHref && actionLabel ? (
      <Link
        href={actionHref}
        className="rounded-full bg-[#9ee6ad] px-6 py-4 text-center font-semibold text-[#102015]"
      >
        {actionLabel}
      </Link>
    ) : undefined;

  return (
    <AdminLayoutFrame title={title} description={description} action={action}>
      <section className="mt-8">{children}</section>
    </AdminLayoutFrame>
  );
}
