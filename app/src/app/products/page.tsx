import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";
import PublicImageCollage from "@/components/PublicImageCollage";
import PublicMobileMenu from "@/components/PublicMobileMenu";
import {buildWhatsAppLink} from "@/lib/whatsapp";
import {getPublicProductCatalogue} from "@/lib/publicCatalogue";
import {publicPageMetadata} from "@/lib/publicSeo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = publicPageMetadata("/products");

export default async function ProductsPage() {
  let categories = [] as Awaited<ReturnType<typeof getPublicProductCatalogue>>;

  try {
    categories = await getPublicProductCatalogue();
  } catch (error) {
    console.error("Public product catalogue unavailable", {
      route: "/products",
      error: error instanceof Error ? error.message : "unknown",
    });
  }

  const whatsappAvailabilityHref = buildWhatsAppLink(
    encodeURIComponent("Hi OneFarmTech, what fresh food is available today?"),
  );

  return (
    <main className="oft-public-surface relative min-h-screen overflow-hidden text-[#101712]">
      <PublicImageCollage
        images={[
          {
            src: "/backgrounds/produce.png",
            alt: "",
            className: "right-[-160px] top-20 h-80 w-80 opacity-[0.3] md:h-[30rem] md:w-[30rem]",
          },
          {
            src: "/backgrounds/trolley.png",
            alt: "",
            className: "left-[-170px] bottom-[-120px] h-80 w-80 opacity-[0.24] md:h-[28rem] md:w-[28rem]",
          },
        ]}
      />

      <div className="oft-public-topline absolute inset-x-0 top-0 h-2" />
      <div className="relative mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-12">
        <header className="flex items-center justify-between gap-6">
          <Link href="/" aria-label="Go to OneFarmTech homepage">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-3 md:flex">
            <Link
              href="/order-request"
              className="rounded-full border border-[#101712]/10 bg-white/80 px-5 py-3 text-sm font-black text-[#101712] shadow-sm hover:bg-white"
            >
              Order online
            </Link>
            <a
              href={whatsappAvailabilityHref}
              className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
            >
              Check availability
            </a>
          </nav>
          <PublicMobileMenu />
        </header>

        <section className="py-14 lg:py-20">
          <div className="max-w-3xl">
            <p className="oft-fade-up oft-public-pill">Products</p>
            <h1 className="oft-fade-up-delay-1 mt-5 text-5xl font-black tracking-tight md:text-6xl">
              What OneFarmTech supplies.
            </h1>
            <p className="oft-fade-up-delay-2 mt-6 text-lg leading-8 text-[#405348]">
              Browse our current product categories. Fresh-food availability and pricing can change, so the team confirms both before payment.
            </p>
          </div>

          {categories.length ? (
            <div className="oft-fade-up-delay-3 mt-10 grid gap-3">
              {categories.map((category) => {
                const categoryHref = buildWhatsAppLink(
                  encodeURIComponent(`Hi OneFarmTech, I'd like to ask about your ${category.name.toLowerCase()} products.`),
                );

                return (
                  <details
                    key={category.name}
                    className="group rounded-[1.5rem] border border-[#102015]/10 bg-white/90 p-5 shadow-sm backdrop-blur"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <h2 className="text-xl font-black text-[#102015]">{category.name}</h2>
                      <span className="flex items-center gap-3 text-sm font-bold text-[#587063]">
                        {category.products.length} {category.products.length === 1 ? "product" : "products"}
                        <span aria-hidden="true" className="text-xl text-[#1f7a3f] transition group-open:rotate-45">+</span>
                      </span>
                    </summary>

                    <div className="mt-5 border-t border-[#102015]/10 pt-5">
                      <ul className="flex flex-wrap gap-2">
                        {category.products.map((product) => (
                          <li
                            key={`${category.name}:${product.name.toLocaleLowerCase("en-NG")}`}
                            className="rounded-full bg-[#f3f8ef] px-3 py-2 text-sm font-bold text-[#405348]"
                          >
                            {product.name}
                            {product.availability === "Limited" || product.availability === "Seasonal"
                              ? ` · ${product.availability}`
                              : ""}
                          </li>
                        ))}
                      </ul>
                      <a
                        href={categoryHref}
                        className="mt-5 inline-flex text-sm font-black text-[#1f7a3f] hover:underline"
                      >
                        Ask about {category.name.toLowerCase()} →
                      </a>
                    </div>
                  </details>
                );
              })}
            </div>
          ) : (
            <div className="oft-public-card mt-10 rounded-[1.5rem] p-6 text-sm leading-7 text-[#405348]">
              Our live catalogue is being updated. Send your list and the team will confirm what is available.
            </div>
          )}
        </section>
      </div>
      <PublicFooter />
    </main>
  );
}
