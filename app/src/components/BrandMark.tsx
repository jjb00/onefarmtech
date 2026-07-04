import Image from "next/image";

type BrandMarkVariant = "light" | "dark";

type BrandMarkProps = {
  compact?: boolean;
  variant?: BrandMarkVariant;
  size?: "sm" | "md";
};

export default function BrandMark({
  compact = false,
  variant = "dark",
  size = "md",
}: BrandMarkProps) {
  const isLight = variant === "light";
  const markSize = size === "sm" ? 40 : 48;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm ${ 
          isLight ? "border-white/20" : "border-[#101712]/10"
        }`}
        style={{width: markSize, height: markSize}}
      >
        <Image
          src="/onefarm logo.jpeg"
          alt="OneFarmTech logo"
          fill
          sizes={`${markSize}px`}
          className="object-contain p-1"
          priority
        />
      </div>

      {!compact && (
        <div>
          <p
            className={`font-black leading-none tracking-tight ${ 
              size === "sm" ? "text-sm" : "text-base"
            } ${isLight ? "text-white" : "text-[#101712]"}`}
          >
            OneFarmTech
          </p>
          <p
            className={`mt-1 text-xs font-semibold leading-none ${ 
              isLight ? "text-white/65" : "text-[#1E2420]/60"
            }`}
          >
            Fresh food supply
          </p>
        </div>
      )}
    </div>
  );
}

export {BrandMark};
