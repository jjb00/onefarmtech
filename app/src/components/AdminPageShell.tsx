import Link from "next/link";
import AdminLayoutFrame from "@/components/admin/AdminLayoutFrame";

type AdminPageShellProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
  compactHeader?: boolean;
  embedded?: boolean;
};

export default function AdminPageShell({
  title,
  description,
  actionHref,
  actionLabel,
  children,
  compactHeader,
  embedded,
}: AdminPageShellProps) {
  if (embedded) return <section>{children}</section>;

  const action =
    actionHref && actionLabel ? (
      <Link
        href={actionHref}
        className="inline-flex min-h-11 items-center rounded-xl bg-[#1f7a3f] px-5 text-sm font-black text-white hover:bg-[#155c2f]"
      >
        {actionLabel}
      </Link>
    ) : undefined;

  return (
    <AdminLayoutFrame
      title={title}
      description={description}
      action={action}
      compactHeader={compactHeader}
    >
      {children}
    </AdminLayoutFrame>
  );
}
