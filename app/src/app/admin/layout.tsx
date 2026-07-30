import {requireStaff} from "@/lib/auth";
import {PRIVATE_NOINDEX_METADATA} from "@/lib/publicSeo";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = PRIVATE_NOINDEX_METADATA;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStaff();
  return children;
}
