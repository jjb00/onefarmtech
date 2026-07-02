type SelectFieldProps = {
  label: string;
  options: readonly string[];
};

export default function SelectField({ label, options }: SelectFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <select className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
