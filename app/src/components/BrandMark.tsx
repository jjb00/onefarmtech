import Image from "next/image";

type BrandMarkProps = {
  compact?: boolean;
  variant?: "light" | "dark";
};

export default function BrandMark({
  compact = false,
  variant = "dark",
}: BrandMarkProps) {
  const textColor = variant === "light" ? "text-white" : "text-[#102015]";
  const mutedColor = variant === "light" ? "text-white/55" : "text-[#405348]";

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <Image
          src="/onefarm-logo.jpeg"
          alt="OneFarmTech logo"
          width={44}
          height={44}
          className="h-10 w-10 object-contain"
          priority
        />
      </div>

      {!compact && (
        <div className="leading-none">
          <p className={`text-lg font-black tracking-tight ${textColor}`}>
            OneFarmTech
          </p>
          <p className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${mutedColor}`}>
            Managed food procurement
          </p>
        </div>
      )}
    </div>
  );
}
