import Image from "next/image";

type BrandMarkVariant = "light" | "dark";

type BrandMarkProps = {
  compact?: boolean;
  variant?: BrandMarkVariant;
  size?: "sm" | "md";
};

function BrandMark({compact = false, variant = "dark", size = "md"}: BrandMarkProps) {
  const isLight = variant === "light";
  const logoSize = size === "sm" ? "h-10 w-10 rounded-xl" : "h-12 w-12 rounded-2xl";
  const titleSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative flex ${logoSize} items-center justify-center overflow-hidden border shadow-sm ${
          isLight
            ? "border-[#F2B84B]/30 bg-[#101712]"
            : "border-[#101712]/10 bg-[#101712]"
        }`}
      >
        <Image
          src="/onefarm-logo.jpeg"
          alt="OneFarmTech"
          fill
          sizes={size === "sm" ? "40px" : "48px"}
          className="object-cover"
          priority
        />
      </div>

      {!compact && (
        <div>
          <p
            className={`${titleSize} font-black leading-none tracking-tight ${
              isLight ? "text-white" : "text-[#101712]"
            }`}
          >
            OneFarmTech
          </p>
          <p
            className={`mt-1 text-xs font-semibold leading-none ${
              isLight ? "text-white/60" : "text-[#1E2420]/60"
            }`}
          >
            Farm-to-city procurement
          </p>
        </div>
      )}
    </div>
  );
}

export {BrandMark};
export default BrandMark;
