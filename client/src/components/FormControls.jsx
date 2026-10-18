const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-indigo-900";

export function SelectField({ label, id, options, placeholder, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      <select id={id} name={id} {...props} className={inputClass}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function SliderField({ label, id, value, onChange, min = 1, max = 5, lowLabel, highLabel }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-medium">
        <label htmlFor={id}>{label}</label>
        <span className="text-indigo-600 dark:text-indigo-400">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600"
      />
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}

export function CheckField({ label, id, checked, onChange, hint }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-indigo-600"
      />
      <span className="text-sm">
        {label}
        {hint && <span className="block text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
      </span>
    </label>
  );
}