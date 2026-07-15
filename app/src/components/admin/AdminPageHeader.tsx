type AdminPageHeaderProps = {title: string; description: string; action?: React.ReactNode; secondaryActions?: React.ReactNode; eyebrow?: string; compact?: boolean};

export default function AdminPageHeader({title, description, action, secondaryActions, eyebrow = "Operations desk", compact = false}: AdminPageHeaderProps) {
  return <header data-admin-page-header={compact ? "compact" : "standard"} className={`border border-[#102015]/10 bg-white text-[#102015] shadow-sm ${compact ? "rounded-2xl px-5 py-4 md:px-6 md:py-5" : "rounded-[2rem] p-6 md:p-8"}`}>
    <div className={`flex flex-col xl:flex-row xl:items-center xl:justify-between ${compact ? "gap-4" : "gap-6"}`}>
      <div>
        {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">{eyebrow}</p> : null}
        <h1 className={`font-black tracking-tight text-[#102015] ${compact ? "mt-2 text-3xl md:text-4xl" : "mt-4 text-4xl md:text-5xl"}`}>{title}</h1>
        <p className={`max-w-4xl text-[#405348] ${compact ? "mt-2 text-sm leading-6 md:text-base" : "mt-4 text-base leading-7 md:text-lg"}`}>{description}</p>
      </div>
      {(action || secondaryActions) ? <div className="flex shrink-0 flex-wrap gap-3">{secondaryActions}{action}</div> : null}
    </div>
  </header>;
}
