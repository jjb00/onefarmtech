import AdminPageShell from "@/components/AdminPageShell";

type AdminPageProps = {
  title: string;
  subtitle?: string;
  description?: string;
  children: React.ReactNode;
  compactHeader?: boolean;
  embedded?: boolean;
};

export function AdminPage({
  title,
  subtitle,
  description,
  children,
  compactHeader,
  embedded,
}: AdminPageProps) {
  return (
    <AdminPageShell title={title} description={description || subtitle || ""} compactHeader={compactHeader} embedded={embedded}>
      {children}
    </AdminPageShell>
  );
}

export default AdminPage;
