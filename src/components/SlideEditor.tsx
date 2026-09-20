import React, { useState } from 'react';
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
  onImageUpload?: (base64: string) => void;
  remixingIndex: number | null;
  onRemix: (index: number, text: string) => void;
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
  onRemix,
  onImageUpload
}: SlideEditorProps) {
  const currentFontSize = override.fontSize ?? 64;
  const currentTextY = override.textY ?? 50;

  return (
    <div className="shrink-0 snap-center border p-2 rounded-lg shadow-sm flex flex-col gap-2 w-[80vw] max-w-sm">
      <canvas
        ref={canvasRef}
        width={1080}
        height={1350}
        className="w-full h-auto rounded"
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

      
      
      <div className="flex justify-between items-center mb-1 gap-2">
        <label className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer transition-colors border flex-1 text-center">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onImageUpload) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  onImageUpload(reader.result as string);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          📸 העלאת תמונה
        </label>
        
        <button 
          onClick={() => alert("פיצ'ר יצירת תמונות ב-AI (כמו Midjourney/DALL-E) נמצא בבטא סגורה וזמין למנויי פרימיום בלבד.\n\nלקבלת גישה, אנא פנה לתמיכה.")}
          className="text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 px-2 py-1 rounded cursor-pointer transition-colors border border-transparent shadow-sm flex-1 text-center"
        >
          ✨ ייצור ב-AI (פרו)
        </button>

        {slide.imageUrl && (
          <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-200 whitespace-nowrap">
            ✓ תמונה הועלתה
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">


        <textarea
          value={slide.text}
          onChange={(e) => onTextChange(e.target.value)}
          className="w-full p-2 border rounded resize-y"
          rows={3}
          dir="rtl"
        />
        <div className="flex justify-end">
          <button
            onClick={() => onRemix(index, slide.text)}
            disabled={remixingIndex === index}
            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs px-3 py-1.5 rounded shadow-sm flex items-center gap-1 transition-colors disabled:opacity-50"
            title="שכתוב קריאייטיבי ע״י AI"
          >
            {remixingIndex === index ? (
              <span className="animate-spin inline-block w-3 h-3 border-2 border-indigo-700 border-t-transparent rounded-full"></span>
            ) : (
              '✨ AI Remix'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
