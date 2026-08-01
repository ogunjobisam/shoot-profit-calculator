interface NumberFieldProps {
  id: string;
  label: string;
  helper?: string;
  prefix?: string;
  suffix?: string;
  value: number;
  step?: number;
  placeholder?: string;
  onChange: (value: number) => void;
}

export function NumberField({
  id,
  label,
  helper,
  prefix,
  suffix,
  value,
  step = 1,
  placeholder,
  onChange,
}: NumberFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold tracking-tight">
        {label}
      </label>
      {helper ? <p className="text-xs leading-snug text-muted-foreground">{helper}</p> : null}
      <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
        {prefix ? <span className="text-base text-muted-foreground">{prefix}</span> : null}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={0}
          placeholder={placeholder}
          value={Number.isFinite(value) && value !== 0 ? value : value === 0 ? 0 : ""}
          onChange={(e) => {
            const next = e.target.value === "" ? 0 : Number(e.target.value);
            onChange(Number.isFinite(next) && next >= 0 ? next : 0);
          }}
          className="h-14 w-full bg-transparent text-lg font-medium outline-none"
        />
        {suffix ? <span className="text-sm text-muted-foreground">{suffix}</span> : null}
      </div>
    </div>
  );
}
