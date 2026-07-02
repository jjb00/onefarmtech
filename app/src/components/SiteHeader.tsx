import Link from "next/link";

const whatsappMessage = encodeURIComponent(
  "Hi OneFarmTech, I want to order farm produce.\n\nBuyer type:\nProduce needed:\nQuantity:\nDelivery area:\nPreferred delivery/pickup date:"
);

const whatsappNumber = "234XXXXXXXXXX";

export default function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-[#102015]">
      <Link href="/" className="text-2xl font-bold tracking-tight">
        OneFarmTech
      </Link>

      <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
        <Link href="/faq">FAQ</Link>
        <Link href="/login">Login</Link>
        <Link href="/dashboard">Buyer Dashboard</Link>
        <Link href="/admin">Admin</Link>
      </nav>

      <a
        href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
        className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-semibold text-white shadow-sm"
      >
        Order on WhatsApp
      </a>
    </header>
  );
}
