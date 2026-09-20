'use client';

import React, { useRef, useState, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import SlideEditor from '@/components/SlideEditor';

import {
  drawMinimal, drawBold, drawGradient, drawDarkLuxury, drawFrame, drawSplit,
  drawStory, drawQuote, drawNumbered, drawMagazine, drawWaves, drawNeon,
  drawImageSplit
} from '@/lib/templates/drawers';

export interface Slide {
  id: string;
  text: string;
  backgroundColor: string;
  textColor: string;
  imageUrl?: string;
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
  | 'neon'
  | 'image-split';

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
  { id: 'image-split',  label: 'חצי תמונה'    },
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
    async (
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
        case 'image-split': await drawImageSplit(ctx, W, H, text, brandColor, isDark, currentOverride, slide.imageUrl); break;
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

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: [1080, 1350] });
      localSlides.forEach((_, index) => {
        const canvas = canvasRefs.current[index];
        if (!canvas) return;
        const imgData = canvas.toDataURL('image/png');
        if (index > 0) {
          doc.addPage([1080, 1350], 'portrait');
        }
        doc.addImage(imgData, 'PNG', 0, 0, 1080, 1350);
      });
      doc.save('carousel.pdf');
    } catch (error) {
      console.error('Error exporting PDF:', error);
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
        {localSlides.map((slide, index) => (
          <SlideEditor
            key={slide.id}
            slide={slide}
            index={index}
            canvasRef={(el) => { if (el) canvasRefs.current[index] = el; }}
            isEditing={editingIndex === index}
            onToggleEdit={() => {
              if (editingIndex === index) setEditingIndex(null);
              else {
                setEditingIndex(index);
                if (!slideOverrides[index]) {
                  setSlideOverrides(prev => ({ ...prev, [index]: { fontSize: 64, textY: 50 } }));
                }
              }
            }}
            override={slideOverrides[index] ?? {}}
            onOverrideChange={(override) => setSlideOverrides(prev => ({ ...prev, [index]: override }))}
            onTextChange={(text) => {
              const newSlides = [...localSlides];
              newSlides[index] = { ...newSlides[index], text };
              setLocalSlides(newSlides);
            }}
            onImageUpload={(base64) => {
              const newSlides = [...localSlides];
              newSlides[index] = { ...newSlides[index], imageUrl: base64 };
              setLocalSlides(newSlides);
            }}

            remixingIndex={remixingIndex}
            onRemix={handleRemix}
          />
        ))}
      </div>

      {/* ── Export buttons ── */}
      <div className="flex gap-4 flex-wrap justify-center w-full pb-8">
        <button
          onClick={handleExportZip}
          disabled={isExporting}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isExporting ? 'מייצא...' : 'הורד קרוסלה (ZIP)'}
        </button>
        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {isExporting ? 'מייצא...' : 'הורד כ-PDF (ללינקדאין)'}
        </button>
      </div>
    </div>
  );
}
