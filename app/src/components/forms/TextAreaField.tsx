type TextAreaFieldProps = {
  label: string;
  placeholder?: string;
};

export default function TextAreaField({ label, placeholder }: TextAreaFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <textarea
        className="min-h-28 rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
        placeholder={placeholder}
      />
    </label>
  );
}
