import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import BrandMark from "@/components/BrandMark";
import CareerApplicationModal from "@/components/CareerApplicationModal";
import PublicFooter from "@/components/PublicFooter";
import PublicImageCollage from "@/components/PublicImageCollage";
import StructuredData from "@/components/StructuredData";
import {
  careerPath,
  careerRoleBySlug,
  careerRoles,
  jobPostingFor,
} from "@/lib/careers";
import {publicIntakeErrorMessage} from "@/lib/publicIntakeProtection";
import {SITE_NAME} from "@/lib/publicSeo";

export const dynamicParams = false;

export function generateStaticParams() {
  return careerRoles.map((role) => ({slug: role.slug}));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{slug: string}>;
}): Promise<Metadata> {
  const {slug} = await params;
  const role = careerRoleBySlug(slug);

  if (!role) return {};

  const path = careerPath(role);
  const title = `${role.title} | Careers at OneFarmTech`;

  return {
    title,
    description: role.summary,
    alternates: {canonical: path},
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: path,
      title,
      description: role.summary,
      locale: "en_NG",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: role.summary,
    },
  };
}

export default async function CareerRolePage({
  params,
  searchParams,
}: {
  params: Promise<{slug: string}>;
  searchParams?: Promise<{
    apply?: string;
    submitted?: string;
    error?: string;
  }>;
}) {
  const {slug} = await params;
  const role = careerRoleBySlug(slug);

  if (!role) notFound();

  const query = await searchParams;
  const showApplication = query?.apply === "1";
  const submitted = query?.submitted === "1";
  const careerErrorMessages: Record<string, string> = {
    validation: "Complete every required field and confirm your consent.",
    "missing-cv": "Please attach your CV.",
    "cv-too-large": "Your CV must be 5MB or smaller.",
    "cv-invalid-type": "Upload your CV as a PDF, DOC or DOCX file.",
    "email-failed": "We could not confirm your application. Please try again.",
  };
  const errorMessage = query?.error
    ? careerErrorMessages[query.error] || publicIntakeErrorMessage(query.error)
    : null;
  const path = careerPath(role);
  const remoteOption = role.locations.includes("Remote");

  return (
    <main className="oft-product-shell min-h-screen bg-[#fbfff8] text-[#102015]">
      <StructuredData data={jobPostingFor(role)} />

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_14%_16%,rgba(31,122,63,0.14),transparent_32%),radial-gradient(circle_at_88%_10%,rgba(242,184,75,0.18),transparent_30%),linear-gradient(180deg,#fbfff8_0%,#f5faef_58%,#fbfff8_100%)]">
        <PublicImageCollage
          images={[
            {
              src: "/backgrounds/buyers.png",
              alt: "",
              className:
                "right-[-190px] top-[-30px] h-72 w-72 opacity-[0.2] md:h-[26rem] md:w-[26rem]",
            },
          ]}
        />
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#1f7a3f] via-[#F2B84B] to-[#1f7a3f]" />

        <div className="relative mx-auto max-w-6xl px-6 py-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" aria-label="Go to OneFarmTech homepage">
              <BrandMark />
            </Link>
            <Link
              href="/careers"
              className="rounded-full border border-[#102015]/10 bg-white px-4 py-2 text-sm font-black text-[#102015] shadow-sm"
            >
              All roles
            </Link>
          </header>

          <section className="py-12 md:py-16">
            <Link
              href="/careers"
              className="text-sm font-black text-[#1f7a3f] hover:underline"
            >
              ← Back to careers
            </Link>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge>{role.department}</Badge>
              {role.stages.map((stage) => (
                <Badge key={stage}>{stage}</Badge>
              ))}
            </div>
            <h1 className="mt-6 max-w-5xl text-4xl font-black tracking-tight md:text-6xl">
              {role.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#405348]">
              {role.summary}
            </p>
          </section>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[1fr_0.38fr] lg:px-10 lg:py-14">
        <article className="rounded-[1.75rem] border border-[#102015]/10 bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1f7a3f]">
            About the role
          </p>
          <h2 className="mt-3 text-3xl font-black">What you will do</h2>
          <p className="mt-4 text-base leading-8 text-[#405348]">{role.details}</p>

          <div className="mt-8 border-t border-[#102015]/10 pt-8">
            <h2 className="text-2xl font-black">Qualification</h2>
            <p className="mt-3 text-base leading-8 text-[#405348]">
              {role.qualification}
            </p>
          </div>

          <div className="mt-8 border-t border-[#102015]/10 pt-8">
            <h2 className="text-2xl font-black">Location and engagement</h2>
            <p className="mt-3 text-base leading-8 text-[#405348]">
              Locations: {role.locations.join(", ")}.
            </p>
            <p className="mt-2 text-base leading-8 text-[#405348]">
              Engagement options: {role.stages.join(", ")}.
            </p>
            {remoteOption ? (
              <p className="mt-2 text-base leading-8 text-[#405348]">
                This role includes a fully remote option for applicants based in
                Nigeria.
              </p>
            ) : null}
          </div>
        </article>

        <aside className="h-fit rounded-[1.75rem] bg-[#102015] p-6 text-white shadow-[0_20px_50px_rgba(16,32,21,0.18)] lg:sticky lg:top-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9fd1aa]">
            Applications open
          </p>
          <h2 className="mt-3 text-2xl font-black">Interested in this role?</h2>
          <p className="mt-3 text-sm leading-7 text-white/75">
            Complete one application form and attach your CV. The OneFarmTech
            team reviews applications manually.
          </p>
          <Link
            href={`${path}?apply=1`}
            className="mt-6 inline-flex w-full justify-center rounded-full bg-[#F2B84B] px-5 py-3 text-sm font-black text-[#102015]"
          >
            Apply for this role
          </Link>
          <p className="mt-4 text-xs leading-6 text-white/60">
            Posted {new Intl.DateTimeFormat("en-NG", {dateStyle: "long"}).format(new Date(`${role.datePosted}T12:00:00Z`))}
          </p>
        </aside>
      </section>

      <PublicFooter />

      {showApplication ? (
        <CareerApplicationModal
          role={role.title}
          returnPath={path}
          errorMessage={errorMessage}
          submitted={submitted}
        />
      ) : null}
    </main>
  );
}

function Badge({children}: {children: React.ReactNode}) {
  return (
    <span className="rounded-full border border-[#1f7a3f]/15 bg-white px-3 py-1 text-xs font-black text-[#1f7a3f]">
      {children}
    </span>
  );
}
