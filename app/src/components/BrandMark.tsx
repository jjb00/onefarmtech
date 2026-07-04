type BrandMarkVariant = "light" | "dark";

type BrandMarkProps = {
  compact?: boolean;
  variant?: BrandMarkVariant;
  size?: "sm" | "md";
};

function BrandMark({compact = false, variant = "dark", size = "md"}: BrandMarkProps) {
  const isLight = variant === "light";
  const markSize = size === "sm" ? "h-10 w-10 rounded-xl text-sm" : "h-12 w-12 rounded-2xl text-base";
  const titleSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex ${markSize} items-center justify-center border font-black shadow-sm ${
          isLight
            ? "border-[#F2B84B]/40 bg-[#F2B84B] text-[#101712]"
            : "border-[#101712]/10 bg-[#101712] text-[#F2B84B]"
        }`}
      >
        OF
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
              isLight ? "text-white/65" : "text-[#1E2420]/60"
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
