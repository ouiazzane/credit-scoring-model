import type { ChangeEvent } from "react";

interface Props {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  error?: string;
  onChange: (value: number) => void;
}

export function FieldSlider({ label, description, value, min, max, step, unit, error, onChange }: Props) {
  const handleNumber = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.value === "") return;
    const parsed = Number(event.target.value);
    if (Number.isFinite(parsed)) onChange(Math.min(max, Math.max(min, parsed)));
  };

  return (
    <div className="field-control">
      <div className="field-heading">
        <label htmlFor={`field-${label}`}>{label}</label>
        <span className="field-help" tabIndex={0} aria-label={`${label}: ${description}`} title={description}>?</span>
      </div>
      <div className="field-input-row">
        <input
          id={`field-${label}`}
          aria-label={label}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <div className="number-input-wrap">
          <input
            aria-label={`${label} value`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleNumber}
            onBlur={() => onChange(Math.min(max, Math.max(min, value)))}
            aria-invalid={Boolean(error)}
          />
          {unit && <span>{unit}</span>}
        </div>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
