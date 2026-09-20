'use client';

import React, { useRef, useState, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import SlideEditor from '@/components/SlideEditor';
import CopilotWidget from '@/components/CopilotWidget';

import {
  drawMinimal, drawBold, drawGradient, drawDarkLuxury, drawFrame, drawSplit,
  drawStory, drawQuote, drawNumbered, drawMagazine, drawWaves, drawNeon,
  drawImageSplit,
  drawImageFullDark, drawImageCircle, drawImageSplitBottom, drawImagePolaroid,
  drawImageSide, drawImageMagazine, drawImageOverlay, drawImageArch
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
  | 'image-split'
  | 'image-full-dark'
  | 'image-circle-profile'
  | 'image-split-bottom'
  | 'image-polaroid'
  | 'image-side'
  | 'image-magazine'
  | 'image-overlay'
  | 'image-arch';

interface TemplateOption {
  id: TemplateId;
  label: string;
}

const TEMPLATES: TemplateOption[] = [
  { id: 'image-split',  label: 'חצי תמונה'    },
  { id: 'image-full-dark',      label: 'תמונת רקע כהה' },
  { id: 'image-circle-profile', label: 'תמונת פרופיל' },
  { id: 'image-polaroid',       label: 'פולארויד' },
  { id: 'minimal',      label: 'מינימליסטי' },
  { id: 'bold',         label: 'נועז'        },
  { id: 'gradient',     label: 'גרדיאנט'     },
  { id: 'image-side',           label: 'חצי רוחב' },
  { id: 'image-magazine',       label: 'שער מגזין' },
  { id: 'dark-luxury',  label: 'יוקרה כהה'   },
  { id: 'frame',        label: 'ממוסגר'       },
  { id: 'split',        label: 'מפוצל'        },
  { id: 'image-split-bottom',   label: 'פיצול תחתון' },
  { id: 'story',        label: 'סיפור'        },
  { id: 'quote',        label: 'ציטוט'        },
  { id: 'image-overlay',        label: 'תמונה עם שכבה' },
  { id: 'numbered',     label: 'ממוספר'       },
  { id: 'magazine',     label: 'מגזין'        },
  { id: 'image-arch',           label: 'מסגרת קשת' },
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

export default function CarouselRenderer({
  slides,
  brandColor: initialBrandColor = '#6366f1',
  slideOverrides: initialSlideOverrides = {},
}: CarouselRendererProps) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [activeBrandColor, setActiveBrandColor] = useState(initialBrandColor);
  const [localSlides, setLocalSlides] = useState<Slide[]>(slides);
  const [theme,    setTheme]    = useState<'light' | 'dark'>('light');
  const [template, setTemplate] = useState<TemplateId>('minimal');
  const [globalFont, setGlobalFont] = useState('Heebo');

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
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
        case 'minimal':     drawMinimal    (ctx, W, H, text, activeBrandColor, isDark, currentOverride, globalFont);              break;
        case 'bold':        drawBold       (ctx, W, H, text, activeBrandColor, isDark, currentOverride, globalFont);              break;
        case 'gradient':    drawGradient   (ctx, W, H, text, activeBrandColor, isDark, currentOverride, globalFont);              break;
        case 'dark-luxury': drawDarkLuxury (ctx, W, H, text, activeBrandColor, isDark, currentOverride, globalFont);              break;
        case 'frame':       drawFrame      (ctx, W, H, text, activeBrandColor, isDark, currentOverride, globalFont);              break;
        case 'split':       drawSplit      (ctx, W, H, text, activeBrandColor, isDark, slideIndex, currentOverride, globalFont);  break;
        case 'story':       drawStory      (ctx, W, H, text, activeBrandColor, isDark, currentOverride, globalFont);              break;
        case 'quote':       drawQuote      (ctx, W, H, text, activeBrandColor, isDark, currentOverride, globalFont);              break;
        case 'numbered':    drawNumbered   (ctx, W, H, text, activeBrandColor, isDark, slideIndex, currentOverride, globalFont);  break;
        case 'magazine':    drawMagazine   (ctx, W, H, text, activeBrandColor, isDark, currentOverride, globalFont);              break;
        case 'waves':       drawWaves      (ctx, W, H, text, activeBrandColor, isDark, currentOverride, globalFont);              break;
        case 'neon':        drawNeon       (ctx, W, H, text, activeBrandColor, isDark, currentOverride, globalFont);              break;
        case 'image-split': await drawImageSplit(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slide.imageUrl, globalFont); break;
        case 'image-full-dark': await drawImageFullDark(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slide.imageUrl, globalFont); break;
        case 'image-circle-profile': await drawImageCircle(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slide.imageUrl, globalFont); break;
        case 'image-split-bottom': await drawImageSplitBottom(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slide.imageUrl, globalFont); break;
        case 'image-polaroid': await drawImagePolaroid(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slide.imageUrl, globalFont); break;
        case 'image-side': await drawImageSide(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slide.imageUrl, globalFont); break;
        case 'image-magazine': await drawImageMagazine(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slide.imageUrl, globalFont); break;
        case 'image-overlay': await drawImageOverlay(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slide.imageUrl, globalFont); break;
        case 'image-arch': await drawImageArch(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slide.imageUrl, globalFont); break;
        default:            drawMinimal    (ctx, W, H, text, activeBrandColor, isDark, currentOverride, globalFont);
      }
    },
    [theme, activeBrandColor, slideOverrides, globalFont]
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
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-gray-50 dark:bg-gray-900 overflow-hidden" dir="rtl">
      
      {/* Left Sidebar */}
      <div className="w-full md:w-80 bg-white dark:bg-gray-800 p-4 border-l border-gray-200 dark:border-gray-700 overflow-y-auto order-last md:order-first">
        <div className="flex flex-col gap-4 mb-8">
          <button
            onClick={handleExportZip}
            disabled={isExporting}
            className="w-full px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isExporting ? 'מייצא...' : 'הורד קרוסלה (ZIP)'}
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="w-full px-4 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {isExporting ? 'מייצא...' : 'הורד כ-PDF (ללינקדאין)'}
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-200">תבנית עיצוב</h3>
          <select 
            value={template} 
            onChange={(e) => setTemplate(e.target.value as TemplateId)}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-200">גופן</h3>
          <select 
            value={globalFont} 
            onChange={(e) => setGlobalFont(e.target.value)}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="Heebo">Heebo</option>
            <option value="Rubik">Rubik</option>
            <option value="Assistant">Assistant</option>
            <option value="Varela Round">Varela Round</option>
          </select>
        </div>

        <div className="mb-6">
          <button
            onClick={toggleTheme}
            className={`w-full px-4 py-2 rounded font-semibold transition-all duration-300 shadow-sm ${
              theme === 'light'
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            {theme === 'light' ? 'מצב כהה' : 'מצב בהיר'}
          </button>
        </div>

        <div className="mb-6">
          <CopilotWidget 
            slides={localSlides}
            template={template}
            globalFont={globalFont}
            brandColor={activeBrandColor}
            theme={theme}
            onUpdateSlideText={(index, text) => {
              const newSlides = [...localSlides];
              if (newSlides[index]) {
                newSlides[index] = { ...newSlides[index], text };
                setLocalSlides(newSlides);
              }
            }}
            onChangeTemplate={(tpl) => setTemplate(tpl)}
            onChangeFont={(font) => setGlobalFont(font)}
            onChangeColors={(color, newTheme) => {
              console.log('Copilot tried to change color:', color, newTheme);
            }}
          />
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-200">שקפים</h3>
          <div className="flex flex-col gap-2">
            {localSlides.map((slide, i) => (
              <div 
                key={slide.id} 
                onClick={() => setActiveSlideIndex(i)}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  i === activeSlideIndex 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="font-bold text-sm text-gray-600 dark:text-gray-400">שקף {i + 1}</div>
                <div className="text-sm text-gray-800 dark:text-gray-200 truncate">{slide.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Central Stage */}
      <div className="flex-1 flex flex-col h-screen md:h-screen min-h-[100dvh] overflow-hidden">
        {/* Top Bar */}
        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            {onGoBack && (
              <button onClick={onGoBack} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition px-2">
                ← חזור
              </button>
            )}
            <h2 className="font-bold text-xl text-gray-800 dark:text-gray-100">
              תצוגה מקדימה
            </h2>
          </div>
          <div className="flex gap-4 items-center">
            <button 
              disabled={activeSlideIndex === localSlides.length - 1} 
              onClick={() => setActiveSlideIndex(i => i + 1)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              הבא
            </button>
            <span className="text-gray-600 dark:text-gray-300 font-medium">שקף {activeSlideIndex + 1} מתוך {localSlides.length}</span>
            <button 
              disabled={activeSlideIndex === 0} 
              onClick={() => setActiveSlideIndex(i => i - 1)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              הקודם
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex justify-center items-center p-8 overflow-auto bg-gray-100 dark:bg-gray-900 relative">
          {localSlides.map((slide, i) => (
            <div key={slide.id} className={`transition-opacity duration-300 ${i === activeSlideIndex ? 'block opacity-100' : 'hidden opacity-0'}`}>
              <canvas 
                ref={(el) => { if (el) canvasRefs.current[i] = el; }} 
                width={1080} 
                height={1350} 
                className="max-h-[60vh] max-w-full object-contain shadow-2xl rounded"
              />
            </div>
          ))}
        </div>

        {/* Slide Controls */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-center shadow-lg z-10 overflow-y-auto max-h-[35vh]">
          {localSlides[activeSlideIndex] && (
            <div className="w-full max-w-xl">
              
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700 dark:text-gray-300">עריכת שקף {activeSlideIndex + 1}</h3>
            <button 
              onClick={() => removeSlide(activeSlideIndex)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded text-sm transition-colors"
              disabled={localSlides.length <= 1}
            >
              🗑️ מחק שקף זה
            </button>
          </div>
\n          <SlideEditor
                slide={localSlides[activeSlideIndex]}
                index={activeSlideIndex}
                canvasRef={{ current: null }}
                isEditing={editingIndex === activeSlideIndex}
                onToggleEdit={() => {
                  if (editingIndex === activeSlideIndex) setEditingIndex(null);
                  else {
                    setEditingIndex(activeSlideIndex);
                    if (!slideOverrides[activeSlideIndex]) {
                      setSlideOverrides(prev => ({ ...prev, [activeSlideIndex]: { fontSize: 64, textY: 50 } }));
                    }
                  }
                }}
                override={slideOverrides[activeSlideIndex] ?? {}}
                onOverrideChange={(override) => setSlideOverrides(prev => ({ ...prev, [activeSlideIndex]: override }))}
                onTextChange={(text) => {
                  const newSlides = [...localSlides];
                  newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], text };
                  setLocalSlides(newSlides);
                }}
                onImageUpload={(base64) => {
                  const newSlides = [...localSlides];
                  newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], imageUrl: base64 };
                  setLocalSlides(newSlides);
                  
                  if (!template.startsWith('image-')) {
                    setTemplate('image-split');
                    
                    const toast = document.createElement('div');
                    toast.innerText = 'התבנית הוחלפה אוטומטית כדי לתמוך בתמונה!';
                    toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm font-bold animate-bounce';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 4000);
                  }
                }}
                remixingIndex={remixingIndex}
                onRemix={handleRemix}
              />
            </div>
          )}
        </div>

        {/* Bottom Filmstrip (Optional) */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-3 overflow-x-auto">
          {localSlides.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setActiveSlideIndex(i)}
              className={`shrink-0 w-12 h-12 rounded font-bold shadow-sm transition-colors ${
                i === activeSlideIndex 
                  ? 'bg-blue-600 text-white border-2 border-blue-600' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
