import React from 'react';
import { Slide } from '@/components/CarouselRenderer';
import { SlideOverride } from '@/lib/templates/drawers';
import ImagePickerControl from '@/components/ImagePickerControl';

interface SlideEditorProps {
  slide: Slide;
  index: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isEditing: boolean;
  onToggleEdit: () => void;
  override: SlideOverride;
  onOverrideChange: (override: SlideOverride) => void;
  onTextChange: (text: string) => void;
  /** תמיד מעביר את אינדקס השקף — כדי שלא יישמר לתמונה של שקף אחר */
  onImageUpload?: (slideIndex: number, base64: string) => void;
  onImageClear?: (slideIndex: number) => void;
  remixingIndex: number | null;
  remixSuggestion?: string;
  onRemix: (index: number, text: string) => void;
  onApplyRemix: (index: number) => void;
  onDismissRemix: (index: number) => void;
  /** תבנית ויזואלית נוכחית של השקף */
  template?: string;
  /** stack = מובייל / צר; split = מחשב — מלל והמלצת AI זה לצד זה */
  layout?: 'stack' | 'split';
}

export default function SlideEditor({
  slide,
  index,
  canvasRef,
  isEditing,
  onToggleEdit,
  override,
  onOverrideChange,
  onTextChange,
  remixingIndex,
  remixSuggestion,
  onRemix,
  onApplyRemix,
  onDismissRemix,
  onImageUpload,
  onImageClear,
  template,
  layout = 'stack',
}: SlideEditorProps) {
  const currentFontSize = override.fontSize ?? 64;
  const currentTextY = override.textY ?? 50;
  const isRemixing = remixingIndex === index;
  const hasSuggestion = Boolean(remixSuggestion?.trim());
  const isSplit = layout === 'split';

  const currentScale = Math.round((override.imageScale ?? 1.0) * 100);
  const currentCropTop = override.cropTopPercent ?? 0;
  const currentShape = override.imageShape ?? 'rect';
  const currentVibe = override.vibeEffect ?? 'none';
  const isMultiImage = ['image-dual-split', 'image-compare', 'image-grid-2'].includes(template || '');

  const typographyControls = isEditing ? (
    <div
      className="flex flex-col gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs"
      dir="rtl"
    >
      {/* גופן ומיקום טקסט */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-gray-700 dark:text-gray-300 font-medium">
          <span>גודל גופן</span>
          <span className="font-mono text-[11px] text-gray-500">
            {currentFontSize}px
          </span>
        </div>
        <input
          type="range"
          min={48}
          max={120}
          value={currentFontSize}
          onChange={(e) =>
            onOverrideChange({ ...override, fontSize: Number(e.target.value) })
          }
          className="w-full accent-indigo-600 cursor-pointer"
        />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-gray-700 dark:text-gray-300 font-medium">
          <span>מיקום טקסט אנכי</span>
          <span className="font-mono text-[11px] text-gray-500">
            {currentTextY}%
          </span>
        </div>
        <input
          type="range"
          min={20}
          max={80}
          value={currentTextY}
          onChange={(e) =>
            onOverrideChange({ ...override, textY: Number(e.target.value) })
          }
          className="w-full accent-indigo-600 cursor-pointer"
        />
      </div>

      {/* שליטה בתמונה — חיתוך, קירוב, הרחקה וצורות */}
      {slide.imageUrl ? (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
          <p className="font-bold text-[11px] text-indigo-700 dark:text-indigo-300">
            התאמת תמונה וחיתוך
          </p>
          
          {/* זום (קירוב / הרחקה) */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
              <span>קירוב / הרחקה (זום)</span>
              <span className="font-mono text-[11px] text-gray-500">{currentScale}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              step={5}
              value={currentScale}
              onChange={(e) =>
                onOverrideChange({ ...override, imageScale: Number(e.target.value) / 100 })
              }
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* חיתוך חלק עליון */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
              <span>חיתוך חלק עליון</span>
              <span className="font-mono text-[11px] text-gray-500">{currentCropTop}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={currentCropTop}
              onChange={(e) =>
                onOverrideChange({ ...override, cropTopPercent: Number(e.target.value) })
              }
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* צורת שיבוץ התמונה */}
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">צורת תמונה:</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'rect', label: 'מלבן' },
                { id: 'circle', label: 'עיגול' },
                { id: 'ellipse', label: 'אליפסה' },
                { id: 'rounded', label: 'מעוגל' },
                { id: 'arch', label: 'קשת' },
              ].map((shape) => (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => onOverrideChange({ ...override, imageShape: shape.id as any })}
                  className={`py-1 px-1.5 rounded text-[11px] font-bold border transition-colors ${
                    currentShape === shape.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {shape.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* בחירת וייב ואפקט לשקף */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-1">
        <span className="font-bold text-[11px] text-indigo-700 dark:text-indigo-300">וייב ואווירה ויזואלית</span>
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: 'none', label: 'רגיל' },
            { id: 'luxury', label: '✨ יוקרתי' },
            { id: 'glow', label: '🔮 הילה' },
            { id: 'tech', label: '⚡ הייטק' },
            { id: 'warm', label: '🌅 שקיעה' },
            { id: 'dynamic', label: '🌊 דינמי' },
          ].map((vibe) => (
            <button
              key={vibe.id}
              type="button"
              onClick={() => onOverrideChange({ ...override, vibeEffect: vibe.id as any })}
              className={`py-1 px-1 rounded text-[11px] font-bold border transition-colors truncate ${
                currentVibe === vibe.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-50'
              }`}
            >
              {vibe.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  const imageBlock = (
    <div className="flex flex-col gap-2" dir="rtl">
      {onImageUpload ? (
        <ImagePickerControl
          variant="compact"
          compactLabel={isMultiImage ? "תמונה ראשית (1)" : "העלאת תמונה לשקף זה"}
          value={slide.imageUrl ?? null}
          onChange={(next) => {
            if (next) onImageUpload(index, next);
            else onImageClear?.(index);
          }}
        />
      ) : null}

      {/* תמונה שנייה בתבניות מרובות תמונות */}
      {isMultiImage && onImageUpload ? (
        <div className="mt-1">
          <ImagePickerControl
            variant="compact"
            compactLabel="תמונה משנית (2)"
            value={override.secondImageUrl ?? null}
            onChange={(next) => {
              onOverrideChange({ ...override, secondImageUrl: next || undefined });
            }}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5 items-center">
        {slide.imageUrl ? (
          <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200 whitespace-nowrap">
            ✓ תמונה 1
          </span>
        ) : null}
        {isMultiImage && override.secondImageUrl ? (
          <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200 whitespace-nowrap">
            ✓ תמונה 2
          </span>
        ) : null}
      </div>
    </div>
  );

  const textBlock = (
    <div className="flex flex-col gap-2 min-w-0">
      <label className="text-[11px] font-semibold text-gray-500">
        טקסט נוכחי בשקף
      </label>
      <textarea
        value={slide.text}
        onChange={(e) => onTextChange(e.target.value)}
        className="w-full p-2 border rounded resize-y bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600"
        rows={isSplit ? 5 : 3}
        dir="rtl"
      />
    </div>
  );

  const remixBlock = (
    <div
      className={`flex flex-col gap-2 min-w-0 ${
        isSplit
          ? 'rounded-xl border border-indigo-200/80 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30 p-3'
          : ''
      }`}
      dir="rtl"
    >
      {isSplit ? (
        <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200">
          המלצת ניסוח עם AI
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => onRemix(index, slide.text)}
        disabled={isRemixing || !slide.text.trim()}
        className="w-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-100 hover:bg-indigo-200 dark:hover:bg-indigo-900/70 text-xs font-bold px-3 py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        title="מציע ניסוח מחדש — בלי למחוק את הטקסט הנוכחי"
      >
        {isRemixing ? (
          <>
            <span className="animate-spin inline-block w-3 h-3 border-2 border-indigo-700 border-t-transparent rounded-full" />
            מייצר המלצה…
          </>
        ) : (
          '✨ שכתוב עם AI'
        )}
      </button>

      {hasSuggestion ? (
        <div className="rounded-lg border border-indigo-200 dark:border-indigo-600/40 bg-indigo-50 dark:bg-indigo-950/40 p-2 space-y-2 flex-1 min-h-0 overflow-y-auto">
          {!isSplit ? (
            <p className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-200">
              המלצת ניסוח
            </p>
          ) : null}
          <p className="text-xs text-indigo-950 dark:text-indigo-100 whitespace-pre-wrap leading-relaxed">
            {remixSuggestion}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onApplyRemix(index)}
              className="flex-1 text-xs font-bold bg-indigo-600 text-white rounded px-2 py-1.5"
            >
              החל
            </button>
            <button
              type="button"
              onClick={() => onDismissRemix(index)}
              className="flex-1 text-xs font-bold bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-600 text-indigo-800 dark:text-indigo-200 rounded px-2 py-1.5"
            >
              דחה
            </button>
          </div>
        </div>
      ) : isSplit ? (
        <p className="text-[11px] text-indigo-800/70 dark:text-indigo-200/70 leading-snug">
          לחצו לשכתוב — ההמלצה תופיע כאן ליד הטקסט, בלי לגלול למטה.
        </p>
      ) : null}
    </div>
  );

  return (
    <div
      className={
        isSplit
          ? 'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 p-3 shadow-sm'
          : 'shrink-0 snap-center border p-2 rounded-lg shadow-sm flex flex-col gap-2 w-full max-w-sm'
      }
    >
      <canvas
        ref={canvasRef}
        width={1080}
        height={1350}
        className="hidden w-full h-auto rounded"
        style={{ direction: 'rtl' }}
      />

      <div className="flex items-center justify-between mb-1">
        <button
          type="button"
          onClick={onToggleEdit}
          className={`px-3 py-1 rounded text-xs font-semibold transition-colors border ${
            isEditing
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'
          }`}
        >
          עריכה
        </button>
      </div>

      {typographyControls}

      {isSplit ? (
        <div className="grid grid-cols-2 gap-4 items-start">
          <div className="flex flex-col gap-2 min-w-0">
            {imageBlock}
            {textBlock}
          </div>
          {remixBlock}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {imageBlock}
          {textBlock}
          {remixBlock}
        </div>
      )}
    </div>
  );
}
