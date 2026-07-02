type FormFieldProps = {
  label: string;
  placeholder?: string;
  type?: string;
};

export default function FormField({
  label,
  placeholder,
  type = "text",
}: FormFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}
