'use client';

import React, { useRef, useState, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  drawMinimal, drawBold, drawGradient, drawDarkLuxury, drawFrame, drawSplit,
  drawStory, drawQuote, drawNumbered, drawMagazine, drawWaves, drawNeon
} from '@/lib/templates/drawers';

export interface Slide {
  id: string;
  text: string;
  backgroundColor: string;
  textColor: string;
}

export type TemplateId =
  | 'minimal'
  | 'bold'
  | 'gradient'
  | 'dark-luxury'
  | 'frame'
  | 'split'
  | 'story'
  | 'quote'
  | 'numbered'
  | 'magazine'
  | 'waves'
  | 'neon';

interface TemplateOption {
  id: TemplateId;
  label: string;
}

const TEMPLATES: TemplateOption[] = [
  { id: 'minimal',      label: 'מינימליסטי' },
  { id: 'bold',         label: 'נועז'        },
  { id: 'gradient',     label: 'גרדיאנט'     },
  { id: 'dark-luxury',  label: 'יוקרה כהה'   },
  { id: 'frame',        label: 'ממוסגר'       },
  { id: 'split',        label: 'מפוצל'        },
  { id: 'story',        label: 'סיפור'        },
  { id: 'quote',        label: 'ציטוט'        },
  { id: 'numbered',     label: 'ממוספר'       },
  { id: 'magazine',     label: 'מגזין'        },
  { id: 'waves',        label: 'גלים'         },
  { id: 'neon',         label: 'ניאון'        },
];

export interface SlideOverride {
  fontSize?: number;
  textY?: number;
}

interface CarouselRendererProps {
  slides: Slide[];
  brandColor?: string;
  slideOverrides?: Record<number, SlideOverride>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export default function CarouselRenderer({
  slides,
  brandColor = '#6366f1',
  slideOverrides: initialSlideOverrides = {},
}: CarouselRendererProps) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [localSlides, setLocalSlides] = useState<Slide[]>(slides);
  const [theme,    setTheme]    = useState<'light' | 'dark'>('light');
  const [template, setTemplate] = useState<TemplateId>('minimal');

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [slideOverrides, setSlideOverrides] = useState<Record<number, { fontSize?: number; textY?: number }>>(initialSlideOverrides);
  const [remixingIndex, setRemixingIndex] = useState<number | null>(null);

  const CANVAS_WIDTH  = 1080;
  const CANVAS_HEIGHT = 1350;

  const handleRemix = async (index: number, currentText: string) => {
    setRemixingIndex(index);
    try {
      const res = await fetch('/api/remix-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentText }),
      });
      if (!res.ok) throw new Error('Failed to remix');
      const data = await res.json();
      
      const newSlides = [...localSlides];
      newSlides[index] = { ...newSlides[index], text: data.newText };
      setLocalSlides(newSlides);
    } catch (err) {
      console.error(err);
      alert('אירעה שגיאה בשיכתוב השקף.');
    } finally {
      setRemixingIndex(null);
    }
  };

  const drawSlide = useCallback(
    (
      canvas: HTMLCanvasElement,
      slide: Slide,
      slideIndex: number,
      tpl: TemplateId,
      override?: SlideOverride
    ) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const currentOverride = override ?? slideOverrides[slideIndex];
      const isDark          = theme === 'dark';
      const W               = CANVAS_WIDTH;
      const H               = CANVAS_HEIGHT;
      const text            = slide.text;

      ctx.shadowBlur  = 0;
      ctx.globalAlpha = 1;

      switch (tpl) {
        case 'minimal':     drawMinimal    (ctx, W, H, text, brandColor, isDark, currentOverride);              break;
        case 'bold':        drawBold       (ctx, W, H, text, brandColor, isDark, currentOverride);              break;
        case 'gradient':    drawGradient   (ctx, W, H, text, brandColor, isDark, currentOverride);              break;
        case 'dark-luxury': drawDarkLuxury (ctx, W, H, text, brandColor, isDark, currentOverride);              break;
        case 'frame':       drawFrame      (ctx, W, H, text, brandColor, isDark, currentOverride);              break;
        case 'split':       drawSplit      (ctx, W, H, text, brandColor, isDark, slideIndex, currentOverride);  break;
        case 'story':       drawStory      (ctx, W, H, text, brandColor, isDark, currentOverride);              break;
        case 'quote':       drawQuote      (ctx, W, H, text, brandColor, isDark, currentOverride);              break;
        case 'numbered':    drawNumbered   (ctx, W, H, text, brandColor, isDark, slideIndex, currentOverride);  break;
        case 'magazine':    drawMagazine   (ctx, W, H, text, brandColor, isDark, currentOverride);              break;
        case 'waves':       drawWaves      (ctx, W, H, text, brandColor, isDark, currentOverride);              break;
        case 'neon':        drawNeon       (ctx, W, H, text, brandColor, isDark, currentOverride);              break;
        default:            drawMinimal    (ctx, W, H, text, brandColor, isDark, currentOverride);
      }
    },
    [theme, brandColor, slideOverrides]
  );

  React.useEffect(() => {
    setLocalSlides(slides);
  }, [slides]);

  React.useEffect(() => {
    localSlides.forEach((slide, index) => {
      const canvas = canvasRefs.current[index];
      if (canvas) {
        drawSlide(canvas, slide, index, template, slideOverrides[index]);
      }
    });
  }, [localSlides, drawSlide, template, slideOverrides]);

  const handleExportZip = async () => {
    setIsExporting(true);
    const zip = new JSZip();

    try {
      const imagePromises = localSlides.map((_, index) => {
        return new Promise<void>((resolve, reject) => {
          const canvas = canvasRefs.current[index];
          if (!canvas) { resolve(); return; }

          canvas.toBlob((blob) => {
            if (blob) {
              zip.file(`slide_${index + 1}.png`, blob);
              resolve();
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          }, 'image/png');
        });
      });

      await Promise.all(imagePromises);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'carousel.zip');
    } catch (error) {
      console.error('Error exporting zip:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <div className="flex flex-col items-center gap-6 p-4 w-full">

      {/* ── Top controls ── */}
      <div className="flex w-full justify-center gap-3">
        <button
          onClick={toggleTheme}
          className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 shadow-sm ${
            theme === 'light'
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          }`}
        >
          {theme === 'light' ? 'מצב כהה' : 'מצב בהיר'}
        </button>
      </div>

      {/* ── Template selector ── */}
      <div
        className="flex flex-row-reverse overflow-x-auto gap-2 pb-2 w-full"
        style={{ direction: 'rtl', scrollbarWidth: 'thin' }}
        dir="rtl"
      >
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => setTemplate(t.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border whitespace-nowrap ${
              template === t.id
                ? 'text-white border-transparent shadow-md'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }`}
            style={template === t.id ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Slides strip ── */}
      <div
        className="flex flex-row overflow-x-auto snap-x snap-mandatory pb-4 w-full max-w-full gap-4"
        style={{ direction: 'rtl' }}
      >
        {localSlides.map((slide, index) => {
          const isEditing = editingIndex === index;
          const currentFontSize = slideOverrides[index]?.fontSize ?? 64;
          const currentTextY = slideOverrides[index]?.textY ?? 50;

          return (
            <div key={slide.id} className="shrink-0 snap-center border p-2 rounded-lg shadow-sm flex flex-col gap-2 w-[80vw] max-w-sm">
              <canvas
                ref={(el) => { canvasRefs.current[index] = el; }}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full h-auto rounded"
                style={{ direction: 'rtl' }}
              />

              {/* ── Per-slide edit toggle ── */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (isEditing) {
                      setEditingIndex(null);
                    } else {
                      setEditingIndex(index);
                      if (!slideOverrides[index]) {
                        setSlideOverrides((prev) => ({
                          ...prev,
                          [index]: { fontSize: 64, textY: 50 },
                        }));
                      }
                    }
                  }}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors border ${
                    isEditing
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                  }`}
                >
                  עריכה
                </button>
              </div>

              {/* ── Sliders panel ── */}
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
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSlideOverrides((prev) => ({
                          ...prev,
                          [index]: {
                            fontSize: val,
                            textY: prev[index]?.textY ?? 50,
                          },
                        }));
                      }}
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
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSlideOverrides((prev) => ({
                          ...prev,
                          [index]: {
                            fontSize: prev[index]?.fontSize ?? 64,
                            textY: val,
                          },
                        }));
                      }}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              <div className="relative">
                <textarea
                  value={slide.text}
                  onChange={(e) => {
                    const newSlides = [...localSlides];
                    newSlides[index] = { ...newSlides[index], text: e.target.value };
                    setLocalSlides(newSlides);
                  }}
                  className="w-full p-2 border rounded resize-y"
                  rows={3}
                  dir="rtl"
                />
                <button
                  onClick={() => handleRemix(index, slide.text)}
                  disabled={remixingIndex === index}
                  className="absolute left-2 bottom-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs px-2 py-1 rounded shadow-sm flex items-center gap-1 transition-colors disabled:opacity-50"
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
          );
        })}
      </div>

      {/* ── Export button ── */}
      <button
        onClick={handleExportZip}
        disabled={isExporting}
        className="px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isExporting ? 'מייצא...' : 'יצא ל-ZIP'}
      </button>
    </div>
  );
}
