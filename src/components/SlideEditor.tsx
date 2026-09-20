import React from 'react';
import { Slide } from '@/components/CarouselRenderer';
import { SlideOverride } from '@/lib/templates/drawers';

interface SlideEditorProps {
  slide: Slide;
  index: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
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
  const slideIndexForUpload = index;
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

      <div className="flex flex-wrap justify-between items-center mb-1 gap-2">
        <label className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer transition-colors border flex-1 text-center">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const input = e.target;
              const file = input.files?.[0];
              if (file && onImageUpload) {
                const reader = new FileReader();
                const lockedIndex = slideIndexForUpload;
                reader.onloadend = () => {
                  onImageUpload(lockedIndex, reader.result as string);
                  input.value = '';
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          📸 העלאת תמונה לשקף זה
        </label>

        <button
          type="button"
          onClick={() =>
            alert(
              "פיצ'ר יצירת תמונות ב-AI (כמו Midjourney/DALL-E) נמצא בבטא סגורה וזמין למנויי פרימיום בלבד.\n\nלקבלת גישה, אנא פנה לתמיכה."
            )
          }
          className="text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 px-2 py-1 rounded cursor-pointer transition-colors border border-transparent shadow-sm flex-1 text-center"
        >
          ✨ תמונה ב-AI (פרו)
        </button>

        {slide.imageUrl && (
          <>
            <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-200 whitespace-nowrap">
              ✓ תמונה בשקף {index + 1}
            </span>
            {onImageClear && (
              <button
                type="button"
                onClick={() => onImageClear(index)}
                className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded border border-red-200 whitespace-nowrap"
              >
                הסר תמונה
              </button>
            )}
          </>
        )}
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
            '✨ הצע ניסוח ב-AI'
          )}
        </button>

        {hasSuggestion ? (
          <div className="rounded-lg border border-violet-300 bg-violet-50 dark:bg-violet-950/40 dark:border-violet-700 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold text-violet-800 dark:text-violet-200">
                המלצת ניסוח — עדיין לא הוחלפה בשקף
              </p>
              <button
                type="button"
                onClick={() => onDismissRemix(index)}
                className="text-[10px] text-violet-600 hover:text-violet-900 dark:text-violet-300"
              >
                דחה
              </button>
            </div>
            <p
              className="text-sm text-violet-950 dark:text-violet-100 leading-relaxed whitespace-pre-wrap"
              dir="rtl"
            >
              {remixSuggestion}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => onApplyRemix(index)}
                className="flex-1 min-w-[8rem] bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-2 rounded transition-colors"
              >
                החל בשקף
              </button>
              <button
                type="button"
                onClick={() => onRemix(index, slide.text)}
                disabled={isRemixing}
                className="flex-1 min-w-[8rem] border border-violet-400 text-violet-800 dark:text-violet-200 bg-white/70 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-xs font-bold px-3 py-2 rounded transition-colors disabled:opacity-50"
              >
                {isRemixing ? 'מייצר…' : 'הצע שוב'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
