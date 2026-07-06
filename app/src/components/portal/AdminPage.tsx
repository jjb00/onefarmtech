import AdminPageShell from "@/components/AdminPageShell";

type AdminPageProps = {
  title: string;
  subtitle?: string;
  description?: string;
  children: React.ReactNode;
};

export function AdminPage({
  title,
  subtitle,
  description,
  children,
}: AdminPageProps) {
  return (
    <AdminPageShell title={title} description={description || subtitle || ""}>
      {children}
    </AdminPageShell>
  );
}

export default AdminPage;
