type AdminPageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  eyebrow?: string;
  compact?: boolean;
};

export default function AdminPageHeader({
  title,
  description,
  action,
  secondaryActions,
  eyebrow,
}: AdminPageHeaderProps) {
  return (
    <header className="border-b border-[#102015]/10 pb-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-1 text-xs font-black uppercase tracking-[0.16em] text-[#1f7a3f]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-3xl font-black tracking-tight text-[#102015] md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-[#587063] md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {action || secondaryActions ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {secondaryActions}
            {action}
          </div>
        ) : null}
      </div>
    </header>
  );
}
