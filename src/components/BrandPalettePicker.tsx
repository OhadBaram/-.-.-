'use client';

import React, { useState } from 'react';
import {
  MAX_BRAND_COLORS,
  PALETTE_PRESETS,
  clampPalette,
  normalizeHex,
  recommendPaletteLocal,
  type BrandPalette,
  type PalettePreset,
} from '@/lib/brand-palette';

interface BrandPalettePickerProps {
  value: BrandPalette;
  onChange: (palette: BrandPalette) => void;
  visualStyle?: string | null;
  topic?: string | null;
  /** compact = סיידבר עורך; default = אשף/הגדרות */
  variant?: 'default' | 'compact';
  className?: string;
}

export default function BrandPalettePicker({
  value,
  onChange,
  visualStyle,
  topic,
  variant = 'default',
  className = '',
}: BrandPalettePickerProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const palette = clampPalette(value);

  const setColorAt = (index: number, hex: string) => {
    const next = [...palette];
    next[index] = normalizeHex(hex);
    onChange(clampPalette(next));
  };

  const addColor = () => {
    if (palette.length >= MAX_BRAND_COLORS) return;
    const fallback =
      PALETTE_PRESETS.find((p) => p.id === 'indigo-sky')?.colors[
        palette.length
      ] || '#0ea5e9';
    onChange(clampPalette([...palette, fallback]));
  };

  const removeColor = (index: number) => {
    if (palette.length <= 1) return;
    onChange(clampPalette(palette.filter((_, i) => i !== index)));
  };

  const applyPreset = (preset: PalettePreset) => {
    onChange(clampPalette([...preset.colors]));
    setAiNote(`הוחל שילוב «${preset.label}» — אפשר לערוך.`);
  };

  const suggestLocal = () => {
    const next = recommendPaletteLocal({
      visualStyle,
      topic,
      seedColor: palette[0],
    });
    onChange(next);
    setAiNote('הוחלה המלצה מהירה — אפשר לערוך או לבקש המלצת AI.');
  };

  const suggestAi = async () => {
    setAiLoading(true);
    setAiNote('');
    try {
      const res = await fetch('/api/suggest-palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic || '',
          visualStyle: visualStyle || 'minimal',
          seedColors: palette,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה');
      if (Array.isArray(data.colors) && data.colors.length) {
        onChange(clampPalette(data.colors));
        setAiNote(
          data.reason || 'המלצת AI הוחלה — אפשר לערוך כל צבע.'
        );
      } else {
        suggestLocal();
      }
    } catch {
      suggestLocal();
      setAiNote('AI לא זמין — הוחלה המלצה מקומית. אפשר לערוך.');
    } finally {
      setAiLoading(false);
    }
  };

  const isCompact = variant === 'compact';

  return (
    <div className={`space-y-3 ${className}`} dir="rtl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3
            className={`font-bold text-gray-800 dark:text-gray-100 ${
              isCompact ? 'text-xs' : 'text-sm md:text-base'
            }`}
          >
            פלטת צבעים (עד {MAX_BRAND_COLORS})
          </h3>
          {!isCompact ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              המערכת ממליצה שילוב — אתם יכולים לערוך בכל רגע.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={suggestLocal}
            className="text-[11px] font-bold px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            שילוב מומלץ
          </button>
          <button
            type="button"
            onClick={() => void suggestAi()}
            disabled={aiLoading}
            className="text-[11px] font-bold px-2 py-1 rounded-lg bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {aiLoading ? 'ממליץ…' : 'המלצת AI'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {palette.map((color, i) => (
          <div
            key={`swatch-${i}`}
            className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 px-2.5 py-2"
          >
            <span className="text-[11px] font-semibold text-gray-500 w-14 shrink-0">
              {i === 0 ? 'ראשי' : i === 1 ? 'משני' : 'שלישי'}
            </span>
            <input
              type="color"
              value={normalizeHex(color)}
              onChange={(e) => setColorAt(i, e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent p-0"
              aria-label={`צבע ${i + 1}`}
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColorAt(i, e.target.value)}
              className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-2 py-1.5 text-sm text-left font-mono text-gray-900 dark:text-gray-100"
              dir="ltr"
              spellCheck={false}
            />
            {palette.length > 1 ? (
              <button
                type="button"
                onClick={() => removeColor(i)}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 px-1.5"
                title="הסר צבע"
              >
                הסר
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {palette.length < MAX_BRAND_COLORS ? (
        <button
          type="button"
          onClick={addColor}
          className="w-full text-xs font-bold py-2 rounded-xl border border-dashed border-indigo-300 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
        >
          + הוסף צבע ({palette.length}/{MAX_BRAND_COLORS})
        </button>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {PALETTE_PRESETS.slice(0, isCompact ? 4 : 6).map((preset) => {
          const active =
            clampPalette([...preset.colors]).join('|') ===
            clampPalette(palette).join('|');
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              title={`${preset.label} — ${preset.hint}`}
              className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] transition ${
                active
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-100'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex -space-x-1 space-x-reverse">
                {preset.colors.map((c) => (
                  <span
                    key={c}
                    className="w-3.5 h-3.5 rounded-full border border-white dark:border-gray-800 shadow-sm"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              {!isCompact ? preset.label : null}
            </button>
          );
        })}
      </div>

      {aiNote ? (
        <p className="text-[11px] text-violet-700 dark:text-violet-300">
          {aiNote}
        </p>
      ) : null}
    </div>
  );
}
