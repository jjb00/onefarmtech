import AdminPageShell from "@/components/AdminPageShell";

type AdminPageProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function AdminPage({title, subtitle, children}: AdminPageProps) {
  return (
    <AdminPageShell title={title} subtitle={subtitle}>
      {children}
    </AdminPageShell>
  );
}

export default AdminPage;
