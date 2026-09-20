'use client';

import React, { useState } from 'react';
import {
  MAX_ACCENT_COLORS,
  MAX_BACKGROUND_COLORS,
  PALETTE_PRESETS,
  accentLabel,
  backgroundLabel,
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
  variant?: 'default' | 'compact';
  className?: string;
}

function ColorRow({
  label,
  color,
  onChange,
  onRemove,
  canRemove,
}: {
  label: string;
  color: string;
  onChange: (hex: string) => void;
  onRemove?: () => void;
  canRemove?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 px-2.5 py-2">
      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 w-[4.5rem] shrink-0 truncate">
        {label}
      </span>
      <input
        type="color"
        value={normalizeHex(color)}
        onChange={(e) => onChange(e.target.value)}
        className="w-9 h-9 rounded cursor-pointer border-0 bg-transparent p-0"
        aria-label={label}
      />
      <input
        type="text"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-2 py-1.5 text-sm text-left font-mono text-gray-900 dark:text-gray-100"
        dir="ltr"
        spellCheck={false}
      />
      {canRemove && onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="text-[11px] font-bold text-red-600 hover:text-red-700 px-1.5"
        >
          הסר
        </button>
      ) : null}
    </div>
  );
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
  const isCompact = variant === 'compact';

  const commit = (next: BrandPalette) => onChange(clampPalette(next));

  const setAccent = (index: number, hex: string) => {
    const accents = [...palette.accents];
    accents[index] = normalizeHex(hex);
    commit({ ...palette, accents });
  };

  const setBackground = (index: number, hex: string) => {
    const backgrounds = [...palette.backgrounds];
    backgrounds[index] = normalizeHex(hex);
    commit({ ...palette, backgrounds });
  };

  const addAccent = () => {
    if (palette.accents.length >= MAX_ACCENT_COLORS) return;
    const fallback =
      PALETTE_PRESETS[0].accents[palette.accents.length % 4] || '#0ea5e9';
    commit({ ...palette, accents: [...palette.accents, fallback] });
  };

  const addBackground = () => {
    if (palette.backgrounds.length >= MAX_BACKGROUND_COLORS) return;
    const fallback =
      palette.backgrounds.length % 2 === 0 ? '#ffffff' : '#111827';
    commit({
      ...palette,
      backgrounds: [...palette.backgrounds, fallback],
    });
  };

  const removeAccent = (index: number) => {
    if (palette.accents.length <= 1) return;
    commit({
      ...palette,
      accents: palette.accents.filter((_, i) => i !== index),
    });
  };

  const removeBackground = (index: number) => {
    commit({
      ...palette,
      backgrounds: palette.backgrounds.filter((_, i) => i !== index),
    });
  };

  const applyPreset = (preset: PalettePreset) => {
    commit({
      accents: [...preset.accents],
      backgrounds: [...preset.backgrounds],
    });
    setAiNote(`הוחל שילוב «${preset.label}» — אפשר להוסיף/לערוך צבעים.`);
  };

  const suggestLocal = () => {
    commit(
      recommendPaletteLocal({
        visualStyle,
        topic,
        seedColor: palette.accents[0],
      })
    );
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
          seedPalette: palette,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה');
      if (data.accents || data.colors) {
        commit({
          accents: data.accents || data.colors || palette.accents,
          backgrounds: data.backgrounds || palette.backgrounds,
        });
        setAiNote(
          data.reason || 'המלצת AI הוחלה — אפשר להוסיף ולערוך כל צבע.'
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

  return (
    <div className={`space-y-3 ${className}`} dir="rtl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3
            className={`font-bold text-gray-800 dark:text-gray-100 ${
              isCompact ? 'text-xs' : 'text-sm md:text-base'
            }`}
          >
            פלטת צבעים דינמית
          </h3>
          {!isCompact ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              אקסנטים לרכיבים + רקעים לשקפים. הוסיפו כמה שצריך (עד{' '}
              {MAX_ACCENT_COLORS}+{MAX_BACKGROUND_COLORS}).
            </p>
          ) : (
            <p className="text-[10px] text-gray-400 mt-0.5">
              אקסנטים וגם רקעים — ניתנים להרחבה
            </p>
          )}
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

      <div className="space-y-2">
        <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
          אקסנטים ({palette.accents.length}/{MAX_ACCENT_COLORS})
        </p>
        {palette.accents.map((color, i) => (
          <ColorRow
            key={`accent-${i}`}
            label={accentLabel(i)}
            color={color}
            onChange={(hex) => setAccent(i, hex)}
            canRemove={palette.accents.length > 1}
            onRemove={() => removeAccent(i)}
          />
        ))}
        {palette.accents.length < MAX_ACCENT_COLORS ? (
          <button
            type="button"
            onClick={addAccent}
            className="w-full text-xs font-bold py-2 rounded-xl border border-dashed border-indigo-300 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
          >
            + הוסף אקסנט
          </button>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
          רקעים ({palette.backgrounds.length}/{MAX_BACKGROUND_COLORS})
        </p>
        {palette.backgrounds.map((color, i) => (
          <ColorRow
            key={`bg-${i}`}
            label={backgroundLabel(i)}
            color={color}
            onChange={(hex) => setBackground(i, hex)}
            canRemove
            onRemove={() => removeBackground(i)}
          />
        ))}
        {palette.backgrounds.length < MAX_BACKGROUND_COLORS ? (
          <button
            type="button"
            onClick={addBackground}
            className="w-full text-xs font-bold py-2 rounded-xl border border-dashed border-emerald-300 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
          >
            + הוסף רקע
          </button>
        ) : (
          <p className="text-[10px] text-gray-400">הגעתם למקסימום רקעים</p>
        )}
        {palette.backgrounds.length === 0 ? (
          <p className="text-[11px] text-amber-700 dark:text-amber-300">
            בלי רקעים מותאמים — השקפים יישארו בבהיר/כהה של התבנית.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {PALETTE_PRESETS.slice(0, isCompact ? 4 : 6).map((preset) => {
          const active =
            JSON.stringify(clampPalette({
              accents: preset.accents,
              backgrounds: preset.backgrounds,
            })) === JSON.stringify(palette);
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
                {[...preset.accents.slice(0, 2), ...preset.backgrounds.slice(0, 1)].map(
                  (c) => (
                    <span
                      key={`${preset.id}-${c}`}
                      className="w-3.5 h-3.5 rounded-full border border-white dark:border-gray-800 shadow-sm"
                      style={{ backgroundColor: c }}
                    />
                  )
                )}
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
