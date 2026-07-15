import AdminLayoutFrame from "@/components/admin/AdminLayoutFrame";

type AdminShellProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  compactHeader?: boolean;
};

export default function AdminShell({
  title,
  description,
  action,
  children,
  compactHeader,
}: AdminShellProps) {
  return (
    <AdminLayoutFrame title={title} description={description} action={action} compactHeader={compactHeader}>
      {children}
    </AdminLayoutFrame>
  );
}
