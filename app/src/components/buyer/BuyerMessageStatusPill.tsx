const statusStyles: Record<string, string> = {
  unread: "bg-[#fff6d6] text-[#7a4a00]",
  read: "bg-[#eef6ea] text-[#1f7a3f]",
  prepared: "bg-[#eaf2ff] text-[#2352a3]",
  sent: "bg-[#eef6ea] text-[#1f7a3f]",
  failed: "bg-[#ffe8e5] text-[#9b1c1c]",
};

export default function BuyerMessageStatusPill({status}: {status: string | null | undefined}) {
  const label = status || "Logged";
  const key = label.toLowerCase();
  const style = statusStyles[key] || "bg-[#f1eee4] text-[#405348]";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${style}`}>
      {label}
    </span>
  );
}
