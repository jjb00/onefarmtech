import AdminPageShell from "@/components/AdminPageShell";

type AdminPageProps = {
  title: string;
  subtitle?: string;
  description?: string;
  children: React.ReactNode;
  compactHeader?: boolean;
};

export function AdminPage({
  title,
  subtitle,
  description,
  children,
  compactHeader,
}: AdminPageProps) {
  return (
    <AdminPageShell title={title} description={description || subtitle || ""} compactHeader={compactHeader}>
      {children}
    </AdminPageShell>
  );
}

export default AdminPage;
