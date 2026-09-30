import React from 'react';
import { CONTENT_COUNT_PRESETS, MAX_CONTENT_COUNT, MIN_CONTENT_COUNT, clampContentCount } from '@api/generate';

interface CountSelectorProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  accent?: string;
  id: string;
}

/**
 * Preset buttons (10/15/20/30) plus a free numeric field, clamped to the
 * supported range. Flashcards and quiz counts are controlled independently.
 */
export const CountSelector: React.FC<CountSelectorProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  accent = '#6366F1',
  id,
}) => {
  const isPreset = (CONTENT_COUNT_PRESETS as readonly number[]).includes(value);

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label fw-semibold mb-2 d-flex align-items-center justify-content-between gap-2 flex-wrap">
        <span className="text-bright">{label}</span>
        <span
          className="badge rounded-pill"
          style={{ backgroundColor: `${accent}26`, color: accent, border: `1px solid ${accent}55`, fontSize: 11 }}
        >
          {value} selected
        </span>
      </label>
      <div className="d-flex flex-wrap align-items-center gap-2">
        {CONTENT_COUNT_PRESETS.map((preset) => {
          const active = value === preset;
          return (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onChange(preset)}
              className="btn btn-sm fw-semibold"
              style={{
                minWidth: 52,
                borderRadius: '10px',
                backgroundColor: active ? accent : 'transparent',
                border: `1px solid ${active ? accent : '#2a2f42'}`,
                color: active ? '#fff' : '#9aa3b5',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              {preset}
            </button>
          );
        })}
        <div className="d-flex align-items-center gap-1 ms-auto">
          <input
            id={id}
            type="number"
            className="form-control form-control-sm"
            style={{ width: 84, backgroundColor: '#12101f', border: `1px solid ${isPreset ? '#2a2f42' : accent}`, color: '#fff' }}
            value={value}
            min={MIN_CONTENT_COUNT}
            max={MAX_CONTENT_COUNT}
            step={1}
            disabled={disabled}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') return;
              const n = Number(raw);
              if (!Number.isFinite(n)) return;
              onChange(clampContentCount(n));
            }}
            onBlur={(e) => onChange(clampContentCount(Number(e.target.value)))}
            aria-label={`${label} count`}
          />
        </div>
      </div>
      <div className="text-bright-muted small mt-2 px-1">
        Presets {CONTENT_COUNT_PRESETS.join(' / ')} or any number from {MIN_CONTENT_COUNT} to {MAX_CONTENT_COUNT}.
      </div>
    </div>
  );
};
