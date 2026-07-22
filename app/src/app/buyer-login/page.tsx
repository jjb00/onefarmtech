import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import BuyerLoginModal from "@/components/BuyerLoginModal";
import PublicFooter from "@/components/PublicFooter";

export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  missing: "Enter your email or phone and access code.",
  invalid: "That access code was not recognised.",
  identifier: "Those details do not match the access code.",
  cancelled:
    "This access code has been cancelled. Contact support for a replacement.",
  expired:
    "This access code has expired. Contact support for a replacement.",
  "not-ready":
    "This buyer account is inactive or not yet approved for login.",
  contact:
    "Your buyer contact is inactive or not configured for portal access. Contact OneFarmTech support.",
  required: "Please sign in to view your buyer account.",
};

export default async function BuyerLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{error?: string}>;
}) {
  const params = await searchParams;
  const errorMessage = params?.error
    ? messages[params.error] || "Sign-in could not be completed."
    : null;

  return (
    <main className="flex min-h-screen flex-col bg-[#fbfff8] text-[#102015]">
      <section className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-12">
        <div className="absolute left-6 top-6 z-10">
          <Link href="/" aria-label="Go to OneFarmTech homepage">
            <BrandMark />
          </Link>
        </div>

        <div className="pointer-events-none absolute right-[-8rem] top-[-5rem] h-96 w-96 rounded-full bg-[#1f7a3f]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-8rem] left-[-6rem] h-96 w-96 rounded-full bg-[#F2B84B]/20 blur-3xl" />

        <BuyerLoginModal
          defaultOpen
          errorMessage={errorMessage}
          showTrigger={false}
          allowClose={false}
        />
      </section>

      <PublicFooter />
    </main>
  );
}
