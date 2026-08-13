import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";
import PublicImageCollage from "@/components/PublicImageCollage";
import CareerApplicationModal from "@/components/CareerApplicationModal";
import {careerPath, careerRoleByTitle, careerRoles} from "@/lib/careers";
import {publicIntakeErrorMessage} from "@/lib/publicIntakeProtection";
import {publicPageMetadata} from "@/lib/publicSeo";

const departments = [
  "All",
  ...Array.from(new Set(careerRoles.map((role) => role.department))),
];
const stages = [
  "All",
  ...Array.from(new Set(careerRoles.flatMap((role) => role.stages))),
];
const locations = [
  "All",
  ...Array.from(new Set(careerRoles.flatMap((role) => role.locations))),
].sort((a, b) => {
  if (a === "All") return -1;
  if (b === "All") return 1;
  return a.localeCompare(b);
});

export const metadata = publicPageMetadata("/careers");

export default async function CareersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    department?: string;
    location?: string;
    stage?: string;
    role?: string;
    apply?: string;
    submitted?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const department = params?.department || "All";
  const location = params?.location || "All";
  const stage = params?.stage || "All";
  const selectedRole = String(params?.role || "").trim();
  const selectedCareerRole = careerRoleByTitle(selectedRole);
  const showApplication = params?.apply === "1" && Boolean(selectedCareerRole);
  const submitted = params?.submitted === "1";
  const careerErrorMessages: Record<string, string> = {
    validation: "Complete every required field and confirm your consent.",
    "missing-cv": "Please attach your CV.",
    "cv-too-large": "Your CV must be 5MB or smaller.",
    "cv-invalid-type": "Upload your CV as a PDF, DOC or DOCX file.",
    "email-failed": "We could not confirm your application. Please try again.",
  };
  const errorMessage = params?.error
    ? careerErrorMessages[params.error] || publicIntakeErrorMessage(params.error)
    : null;

  const filtered = careerRoles.filter((role) => {
    return (
      (department === "All" || role.department === department) &&
      (location === "All" || role.locations.includes(location)) &&
      (stage === "All" || role.stages.includes(stage))
    );
  });

  return (
    <main className="oft-product-shell min-h-screen bg-[#fbfff8] text-[#102015]">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_14%_16%,rgba(31,122,63,0.14),transparent_32%),radial-gradient(circle_at_88%_10%,rgba(242,184,75,0.18),transparent_30%),linear-gradient(180deg,#fbfff8_0%,#f5faef_58%,#fbfff8_100%)]">
        <PublicImageCollage
          images={[
            {
              src: "/backgrounds/buyers.png",
              alt: "",
              className:
                "right-[-190px] top-[-30px] h-72 w-72 opacity-[0.22] md:h-[26rem] md:w-[26rem]",
            },
            {
              src: "/backgrounds/trolley.png",
              alt: "",
              className:
                "left-[-190px] bottom-[-120px] hidden h-[24rem] w-[24rem] opacity-[0.22] lg:block",
            },
          ]}
        />
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#1f7a3f] via-[#F2B84B] to-[#1f7a3f]" />

        <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" aria-label="Go to OneFarmTech homepage">
              <BrandMark />
            </Link>
            <Link
              href="/contact"
              className="rounded-full bg-[#1f7a3f] px-4 py-2 text-sm font-black text-white shadow-sm"
            >
              Contact
            </Link>
          </header>

          <section className="py-12">
            <div className="max-w-4xl">
              <p className="inline-flex rounded-full border border-[#1f7a3f]/15 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
                Careers
              </p>
              <h1 className="mt-6 text-5xl font-black tracking-tight md:text-7xl">
                Work with us to improve fresh food supply.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[#405348]">
                Explore practical roles across supply, sales, fulfilment,
                finance, technology, content and community.
              </p>
            </div>
          </section>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <form
          action="/careers"
          className="rounded-[1.5rem] border border-[#102015]/10 bg-white/95 p-4 shadow-[0_18px_48px_rgba(16,23,18,0.08)] backdrop-blur"
        >
          <div className="grid gap-3 lg:grid-cols-3">
            <FilterSelect
              label="Department"
              name="department"
              value={department}
              options={departments}
            />
            <FilterSelect
              label="Location"
              name="location"
              value={location}
              options={locations}
            />
            <FilterSelect
              label="Stage"
              name="stage"
              value={stage}
              options={stages}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#102015]/10 pt-3">
            <p className="text-sm font-bold text-[#405348]">
              {filtered.length} role{filtered.length === 1 ? "" : "s"} shown
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/careers"
                className="rounded-full border border-[#102015]/10 px-4 py-2 text-xs font-black text-[#102015] hover:bg-[#f3f8ef]"
              >
                Reset
              </Link>
              <button
                type="submit"
                className="rounded-full bg-[#1f7a3f] px-4 py-2 text-xs font-black text-white"
              >
                Apply filters
              </button>
            </div>
          </div>
        </form>

        <section className="mt-6 grid gap-4">
          {filtered.map((role) => (
            <article
              key={role.slug}
              className="rounded-[1.5rem] border border-[#102015]/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(16,23,18,0.08)]"
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_0.34fr] lg:items-start">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{role.department}</Badge>
                    {role.stages.slice(0, 3).map((item) => (
                      <Badge key={`${role.slug}-${item}`}>{item}</Badge>
                    ))}
                  </div>

                  <h2 className="mt-4 text-2xl font-black text-[#102015]">
                    <Link className="hover:text-[#1f7a3f]" href={careerPath(role)}>
                      {role.title}
                    </Link>
                  </h2>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[#405348]">
                    {role.summary}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f3f8ef] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#587063]">
                    Locations
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#102015]">
                    {role.locations.slice(0, 7).join(", ")}
                    {role.locations.length > 7 ? " and others" : ""}
                  </p>

                  <Link
                    href={careerPath(role)}
                    className="mt-4 inline-flex rounded-full bg-[#1f7a3f] px-4 py-2 text-xs font-black text-white"
                  >
                    View role and apply
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {!filtered.length ? (
            <div className="rounded-[1.5rem] border border-[#102015]/10 bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-black">No roles match this filter.</h2>
              <p className="mt-2 text-sm text-[#405348]">
                Reset filters or contact us with your location and area of interest.
              </p>
            </div>
          ) : null}
        </section>
      </section>

      <PublicFooter />

      {showApplication && selectedCareerRole ? (
        <CareerApplicationModal
          role={selectedCareerRole.title}
          errorMessage={errorMessage}
          submitted={submitted}
        />
      ) : null}
    </main>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
}) {
  return (
    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#587063]">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="rounded-xl border border-[#102015]/10 bg-[#fbfff8] px-3 py-2 text-sm font-black normal-case tracking-normal text-[#102015]"
      >
        {options.map((option) => (
          <option key={`${name}-${option}`} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Badge({children}: {children: React.ReactNode}) {
  return (
    <span className="rounded-full bg-[#eef8ef] px-3 py-1 text-xs font-black text-[#1f7a3f]">
      {children}
    </span>
  );
}
