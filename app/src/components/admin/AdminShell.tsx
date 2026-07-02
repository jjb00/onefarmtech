import AdminLayoutFrame from "@/components/admin/AdminLayoutFrame";

type AdminShellProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export default function AdminShell({
  title,
  description,
  action,
  children,
}: AdminShellProps) {
  return (
    <AdminLayoutFrame title={title} description={description} action={action}>
      {children}
    </AdminLayoutFrame>
  );
}
