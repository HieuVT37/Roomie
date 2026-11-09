export function SelectField({ label, id, options, placeholder, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <select id={id} name={id} {...props} className="input">
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
      <div className="mb-2 flex items-center justify-between text-sm font-medium">
        <label htmlFor={id}>{label}</label>
        <span className="min-w-[1.75rem] rounded-full bg-subtle px-2 py-0.5 text-center text-xs font-semibold tabular-nums text-brand">
          {value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-brand"
      />
      {(lowLabel || highLabel) && (
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}

export function CheckField({ label, id, checked, onChange, hint }) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] p-2 -m-2 transition-colors hover:bg-subtle"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 cursor-pointer rounded accent-brand"
      />
      <span className="text-sm">
        {label}
        {hint && <span className="hint mt-0.5 block">{hint}</span>}
      </span>
    </label>
  );
}
