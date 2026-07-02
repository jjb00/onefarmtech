type AdminActionButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit";
};

export default function AdminActionButton({
  children,
  type = "button",
}: AdminActionButtonProps) {
  return (
    <button
      type={type}
      className="rounded-full bg-[#1f7a3f] px-6 py-4 font-semibold text-white"
    >
      {children}
    </button>
  );
}
