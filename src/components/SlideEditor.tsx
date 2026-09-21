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
}: SlideEditorProps) {
  const currentFontSize = override.fontSize ?? 64;
  const currentTextY = override.textY ?? 50;
  const isRemixing = remixingIndex === index;
  const hasSuggestion = Boolean(remixSuggestion?.trim());

  return (
    <div className="shrink-0 snap-center border p-2 rounded-lg shadow-sm flex flex-col gap-2 w-[80vw] max-w-sm">
      <canvas
        ref={canvasRef}
        width={1080}
        height={1350}
        className="hidden w-full h-auto rounded"
        style={{ direction: 'rtl' }}
      />

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onToggleEdit}
          className={`px-3 py-1 rounded text-xs font-semibold transition-colors border ${
            isEditing
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
          }`}
        >
          עריכה
        </button>
      </div>

      {isEditing && (
        <div className="flex flex-col gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs" dir="rtl">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-gray-700 dark:text-gray-300 font-medium">
              <span>גודל גופן</span>
              <span className="font-mono text-[11px] text-gray-500">{currentFontSize}px</span>
            </div>
            <input
              type="range"
              min={48}
              max={120}
              value={currentFontSize}
              onChange={(e) => onOverrideChange({ ...override, fontSize: Number(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-gray-700 dark:text-gray-300 font-medium">
              <span>מיקום טקסט אנכי</span>
              <span className="font-mono text-[11px] text-gray-500">{currentTextY}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={80}
              value={currentTextY}
              onChange={(e) => onOverrideChange({ ...override, textY: Number(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 mb-1" dir="rtl">
        {onImageUpload ? (
          <ImagePickerControl
            variant="compact"
            compactLabel="העלאת תמונה לשקף זה"
            value={slide.imageUrl ?? null}
            onChange={(next) => {
              if (next) onImageUpload(index, next);
              else onImageClear?.(index);
            }}
          />
        ) : null}

        {slide.imageUrl ? (
          <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-200 whitespace-nowrap self-start">
            ✓ תמונה בשקף {index + 1}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold text-gray-500">
          טקסט נוכחי בשקף
        </label>
        <textarea
          value={slide.text}
          onChange={(e) => onTextChange(e.target.value)}
          className="w-full p-2 border rounded resize-y"
          rows={3}
          dir="rtl"
        />

        <button
          type="button"
          onClick={() => onRemix(index, slide.text)}
          disabled={isRemixing || !slide.text.trim()}
          className="w-full bg-indigo-100 text-indigo-800 hover:bg-indigo-200 text-xs font-bold px-3 py-2 rounded shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
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
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2 space-y-2" dir="rtl">
            <p className="text-[11px] font-semibold text-indigo-900">המלצת ניסוח</p>
            <p className="text-xs text-indigo-950 whitespace-pre-wrap">{remixSuggestion}</p>
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
                className="flex-1 text-xs font-bold bg-white border border-indigo-200 text-indigo-800 rounded px-2 py-1.5"
              >
                דחה
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
