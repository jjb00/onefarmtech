import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

type PublicPageShellProps = {
  children: React.ReactNode;
};

export default function PublicPageShell({ children }: PublicPageShellProps) {
  return (
    <main className="min-h-screen bg-[#f7f5ec] text-[#102015]">
      <SiteHeader />
      {children}
      <SiteFooter />
    </main>
  );
}
