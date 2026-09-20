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
  /** Visual style template for this slide only */
  template?: TemplateId;
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

/** תבניות מומלצות קודם — השאר מאחורי «עוד תבניות» */
const RECOMMENDED_TEMPLATE_IDS: TemplateId[] = [
  'image-split',
  'minimal',
  'bold',
  'gradient',
  'image-full-dark',
];
const RECOMMENDED_TEMPLATES = RECOMMENDED_TEMPLATE_IDS
  .map((id) => TEMPLATES.find((t) => t.id === id))
  .filter((t): t is TemplateOption => Boolean(t));
const MORE_TEMPLATES = TEMPLATES.filter((t) => !RECOMMENDED_TEMPLATE_IDS.includes(t.id));

const DEFAULT_IMAGE_TEMPLATE: TemplateId = 'image-split';
const DEFAULT_TEXT_TEMPLATE: TemplateId = 'minimal';

type AdvancedPanelId = 'layout' | 'slide-template' | 'font';

export type CarouselLayoutPresetId =
  | 'first-and-last'
  | 'first-only'
  | 'all-images'
  | 'no-images'
  | 'custom';

interface CarouselLayoutPreset {
  id: Exclude<CarouselLayoutPresetId, 'custom'>;
  label: string;
  hint: string;
}

const CAROUSEL_LAYOUT_PRESETS: CarouselLayoutPreset[] = [
  {
    id: 'first-and-last',
    label: 'ראשון ואחרון עם תמונה',
    hint: 'שקף פתיחה וסיום עם תמונה, האמצע טקסט',
  },
  {
    id: 'first-only',
    label: 'רק שקף ראשון עם תמונה',
    hint: 'פתיחה עם תמונה, שאר השקפים טקסט',
  },
  {
    id: 'all-images',
    label: 'כל השקפים עם תמונה',
    hint: 'כל שקף מקבל תבנית עם מקום לתמונה',
  },
  {
    id: 'no-images',
    label: 'בלי תמונות (הכל טקסט)',
    hint: 'כל השקפים בתבניות טקסט בלבד',
  },
];

const FONT_OPTIONS = [
  { id: 'Heebo', label: 'Heebo' },
  { id: 'Rubik', label: 'Rubik' },
  { id: 'Assistant', label: 'Assistant' },
  { id: 'Varela Round', label: 'Varela Round' },
  { id: 'Playpen Sans Hebrew', label: 'Playpen Sans Hebrew' },
  { id: 'Gveret Levin', label: 'Gveret Levin' },
  { id: 'Solitreo', label: 'Solitreo' },
  { id: 'Fredoka', label: 'Fredoka' },
] as const;

function isImageTemplate(id: TemplateId): boolean {
  return id.startsWith('image-');
}

function getSlideTemplate(slide: Slide): TemplateId {
  return slide.template ?? DEFAULT_TEXT_TEMPLATE;
}

function withDefaultTemplates(slides: Slide[], fallback: TemplateId = DEFAULT_TEXT_TEMPLATE): Slide[] {
  // שיבוט עמוק ברמת השקף — מונע שיתוף מקרי של אותו אובייקט בין שקפים
  return slides.map((slide, index) => ({
    ...slide,
    id: slide.id != null && String(slide.id).length > 0 ? String(slide.id) : `slide-${index + 1}`,
    text: slide.text,
    backgroundColor: slide.backgroundColor,
    textColor: slide.textColor,
    imageUrl: slide.imageUrl,
    template: slide.template ?? fallback,
  }));
}

/** מעדכן תמונה לשקף אחד בלבד — לא נוגע בשאר השקפים */
export function setSlideImageAt(
  slides: Slide[],
  slideIndex: number,
  imageUrl: string | undefined,
  fallbackImageTemplate: TemplateId = DEFAULT_IMAGE_TEMPLATE
): Slide[] {
  if (slideIndex < 0 || slideIndex >= slides.length) return slides;
  return slides.map((slide, i) => {
    if (i !== slideIndex) return slide;
    const currentTpl = getSlideTemplate(slide);
    const nextTemplate = isImageTemplate(currentTpl) ? currentTpl : fallbackImageTemplate;
    return {
      ...slide,
      imageUrl,
      template: imageUrl ? nextTemplate : currentTpl,
    };
  });
}

function slideWantsImageForPreset(
  preset: Exclude<CarouselLayoutPresetId, 'custom'>,
  index: number,
  total: number
): boolean {
  switch (preset) {
    case 'first-and-last':
      return index === 0 || index === total - 1;
    case 'first-only':
      return index === 0;
    case 'all-images':
      return true;
    case 'no-images':
      return false;
  }
}

function applyCarouselLayoutPreset(
  slides: Slide[],
  preset: Exclude<CarouselLayoutPresetId, 'custom'>
): Slide[] {
  const total = slides.length;
  return slides.map((slide, index) => {
    const wantsImage = slideWantsImageForPreset(preset, index, total);
    const current = getSlideTemplate(slide);
    if (isImageTemplate(current) === wantsImage) {
      return { ...slide, template: current };
    }
    return {
      ...slide,
      template: wantsImage ? DEFAULT_IMAGE_TEMPLATE : DEFAULT_TEXT_TEMPLATE,
    };
  });
}

function detectCarouselLayoutPreset(slides: Slide[]): CarouselLayoutPresetId {
  const total = slides.length;
  if (total === 0) return 'no-images';

  const flags = slides.map((slide) => isImageTemplate(getSlideTemplate(slide)));
  if (flags.every(Boolean)) return 'all-images';
  if (flags.every((flag) => !flag)) return 'no-images';
  if (flags[0] && flags.slice(1).every((flag) => !flag)) return 'first-only';
  if (
    total >= 2 &&
    flags[0] &&
    flags[total - 1] &&
    flags.slice(1, -1).every((flag) => !flag)
  ) {
    return 'first-and-last';
  }
  return 'custom';
}

export interface SlideOverride {
  fontSize?: number;
  textY?: number;
}

interface CarouselRendererProps {
  slides: Slide[];
  brandColor?: string;
  slideOverrides?: Record<number, SlideOverride>;
  onGoBack?: () => void;
}

export default function CarouselRenderer({
  slides,
  brandColor: initialBrandColor = '#6366f1',
  slideOverrides: initialSlideOverrides = {},
  onGoBack,
}: CarouselRendererProps) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const drawGenerationRef = useRef(0);
  const [isExporting, setIsExporting] = useState(false);
  const [activeBrandColor, setActiveBrandColor] = useState(initialBrandColor);
  const [localSlides, setLocalSlides] = useState<Slide[]>(() => withDefaultTemplates(slides));
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = window.sessionStorage.getItem('carousel-canvas-theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [globalFont, setGlobalFont] = useState('Heebo');

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [slideOverrides, setSlideOverrides] = useState<Record<number, { fontSize?: number; textY?: number }>>(initialSlideOverrides);
  const [remixingIndex, setRemixingIndex] = useState<number | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedPanel, setAdvancedPanel] = useState<AdvancedPanelId>('layout');
  const [showMoreTemplates, setShowMoreTemplates] = useState(false);

  const activeSlide = localSlides[activeSlideIndex];
  const activeSlideTemplate = activeSlide ? getSlideTemplate(activeSlide) : DEFAULT_TEXT_TEMPLATE;
  const carouselLayoutPreset = detectCarouselLayoutPreset(localSlides);
  const activeTemplateIsMore = MORE_TEMPLATES.some((t) => t.id === activeSlideTemplate);

  const CANVAS_WIDTH  = 1080;
  const CANVAS_HEIGHT = 1350;
  const isCanvasDark = theme === 'dark';

  const handleRemix = async (index: number, currentText: string) => {
    setRemixingIndex(index);
    try {
      const res = await fetch('/api/remix-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Failed to remix');
      }
      if (!data.newText) throw new Error('Empty remix result');

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
      override?: SlideOverride,
      generation?: number
    ) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const isStale = () =>
        generation !== undefined && generation !== drawGenerationRef.current;
      if (isStale()) return;

      const currentOverride = override ?? slideOverrides[slideIndex] ?? {};
      const isDark          = theme === 'dark';
      const W               = CANVAS_WIDTH;
      const H               = CANVAS_HEIGHT;
      const text            = slide.text;
      // Quote family names so multi-word fonts (e.g. Playpen Sans Hebrew) work in canvas.
      const fontFamily      = `"${globalFont}", sans-serif`;
      // רק תמונת השקף הנוכחי — אין נפילה לתמונה של שקף אחר
      const slideImageUrl   = slide.imageUrl;

      if (typeof document !== 'undefined' && document.fonts?.load) {
        try {
          await document.fonts.load(`700 64px "${globalFont}"`);
        } catch {
          /* font may still render via CSS fallback once available */
        }
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.shadowBlur  = 0;
      ctx.globalAlpha = 1;

      switch (tpl) {
        case 'minimal':     drawMinimal    (ctx, W, H, text, activeBrandColor, isDark, currentOverride, fontFamily);              break;
        case 'bold':        drawBold       (ctx, W, H, text, activeBrandColor, isDark, currentOverride, fontFamily);              break;
        case 'gradient':    drawGradient   (ctx, W, H, text, activeBrandColor, isDark, currentOverride, fontFamily);              break;
        case 'dark-luxury': drawDarkLuxury (ctx, W, H, text, activeBrandColor, isDark, currentOverride, fontFamily);              break;
        case 'frame':       drawFrame      (ctx, W, H, text, activeBrandColor, isDark, currentOverride, fontFamily);              break;
        case 'split':       drawSplit      (ctx, W, H, text, activeBrandColor, isDark, slideIndex, currentOverride, fontFamily);  break;
        case 'story':       drawStory      (ctx, W, H, text, activeBrandColor, isDark, currentOverride, fontFamily);              break;
        case 'quote':       drawQuote      (ctx, W, H, text, activeBrandColor, isDark, currentOverride, fontFamily);              break;
        case 'numbered':    drawNumbered   (ctx, W, H, text, activeBrandColor, isDark, slideIndex, currentOverride, fontFamily);  break;
        case 'magazine':    drawMagazine   (ctx, W, H, text, activeBrandColor, isDark, currentOverride, fontFamily);              break;
        case 'waves':       drawWaves      (ctx, W, H, text, activeBrandColor, isDark, currentOverride, fontFamily);              break;
        case 'neon':        drawNeon       (ctx, W, H, text, activeBrandColor, isDark, currentOverride, fontFamily);              break;
        case 'image-split': await drawImageSplit(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slideImageUrl, fontFamily, isStale); break;
        case 'image-full-dark': await drawImageFullDark(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slideImageUrl, fontFamily, isStale); break;
        case 'image-circle-profile': await drawImageCircle(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slideImageUrl, fontFamily, isStale); break;
        case 'image-split-bottom': await drawImageSplitBottom(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slideImageUrl, fontFamily, isStale); break;
        case 'image-polaroid': await drawImagePolaroid(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slideImageUrl, fontFamily, isStale); break;
        case 'image-side': await drawImageSide(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slideImageUrl, fontFamily, isStale); break;
        case 'image-magazine': await drawImageMagazine(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slideImageUrl, fontFamily, isStale); break;
        case 'image-overlay': await drawImageOverlay(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slideImageUrl, fontFamily, isStale); break;
        case 'image-arch': await drawImageArch(ctx, W, H, text, activeBrandColor, isDark, currentOverride, slideImageUrl, fontFamily, isStale); break;
        default:            drawMinimal    (ctx, W, H, text, activeBrandColor, isDark, currentOverride, fontFamily);
      }

      if (isStale()) return;
    },
    [theme, activeBrandColor, slideOverrides, globalFont]
  );

  React.useEffect(() => {
    setLocalSlides(withDefaultTemplates(slides));
  }, [slides]);

  React.useEffect(() => {
    try {
      window.sessionStorage.setItem('carousel-canvas-theme', theme);
    } catch {
      /* ignore quota / private mode */
    }
  }, [theme]);

  React.useEffect(() => {
    const generation = ++drawGenerationRef.current;
    localSlides.forEach((slide, index) => {
      const canvas = canvasRefs.current[index];
      if (canvas) {
        void drawSlide(canvas, slide, index, getSlideTemplate(slide), slideOverrides[index], generation);
      }
    });
  }, [localSlides, drawSlide, slideOverrides, theme]);

  const redrawAllSlides = async () => {
    const generation = ++drawGenerationRef.current;
    await Promise.all(
      localSlides.map(async (slide, index) => {
        const canvas = canvasRefs.current[index];
        if (!canvas) return;
        await drawSlide(canvas, slide, index, getSlideTemplate(slide), slideOverrides[index], generation);
      })
    );
  };

  const setSlideTemplate = (index: number, nextTemplate: TemplateId) => {
    setLocalSlides((prev) =>
      prev.map((slide, i) => (i === index ? { ...slide, template: nextTemplate } : slide))
    );
  };

  const handleSlideImageUpload = (slideIndex: number, base64: string) => {
    setLocalSlides((prev) => {
      const before = prev[slideIndex];
      const wasImageTpl = before ? isImageTemplate(getSlideTemplate(before)) : true;
      if (!wasImageTpl) {
        const toast = document.createElement('div');
        toast.innerText = 'תבנית השקף הוחלפה אוטומטית כדי לתמוך בתמונה';
        toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm font-bold animate-bounce';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
      }
      return setSlideImageAt(prev, slideIndex, base64);
    });
  };

  const handleSlideImageClear = (slideIndex: number) => {
    setLocalSlides((prev) => setSlideImageAt(prev, slideIndex, undefined));
  };

  const applyLayoutPreset = (preset: Exclude<CarouselLayoutPresetId, 'custom'>) => {
    setLocalSlides((prev) => applyCarouselLayoutPreset(prev, preset));
  };

  const handleChangeTemplateFromCopilot = (tpl: TemplateId, slideIndex?: number) => {
    if (typeof slideIndex === 'number' && Number.isFinite(slideIndex)) {
      setSlideTemplate(slideIndex, tpl);
      return;
    }
    // Without an index: apply the same visual template to every slide
    setLocalSlides((prev) => prev.map((slide) => ({ ...slide, template: tpl })));
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    const zip = new JSZip();

    try {
      await redrawAllSlides();
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
      await redrawAllSlides();
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

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  const removeSlide = (index: number) => {
    if (localSlides.length <= 1) return;
    setLocalSlides((prev) => prev.filter((_, i) => i !== index));
    setSlideOverrides((prev) => {
      const next: Record<number, { fontSize?: number; textY?: number }> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const i = Number(key);
        if (i < index) next[i] = value;
        else if (i > index) next[i - 1] = value;
      });
      return next;
    });
    setActiveSlideIndex((i) => Math.max(0, Math.min(i, localSlides.length - 2)));
    setEditingIndex(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-full min-h-0 w-full bg-gray-50 dark:bg-gray-900 overflow-hidden" dir="rtl">
      
      {/* סיידבר — עריכה מהירה כברירת מחדל */}
      <div className="w-full md:w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto order-last md:order-first flex flex-col min-h-0">
        {/* ייצוא דביק בראש הסיידבר */}
        <div className="sticky top-0 z-20 flex flex-col gap-2 p-4 pb-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-b border-gray-200 dark:border-gray-700">
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

        <div className="p-4 flex flex-col gap-5">
          {/* עריכה מהירה */}
          <section>
            <h3 className="font-bold mb-1 text-gray-800 dark:text-gray-200">עריכה מהירה</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              טקסט השקף וניווט בין שקפים
            </p>

            {activeSlide && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  טקסט שקף {activeSlideIndex + 1}
                </label>
                <textarea
                  value={activeSlide.text}
                  onChange={(e) => {
                    const newSlides = [...localSlides];
                    newSlides[activeSlideIndex] = {
                      ...newSlides[activeSlideIndex],
                      text: e.target.value,
                    };
                    setLocalSlides(newSlides);
                  }}
                  className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg resize-y bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  rows={4}
                  dir="rtl"
                />
              </div>
            )}

            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">שקפים</h4>
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
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="font-bold text-sm text-gray-600 dark:text-gray-400">שקף {i + 1}</div>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shrink-0">
                      {isImageTemplate(getSlideTemplate(slide))
                        ? slide.imageUrl
                          ? 'תמונה הועלתה'
                          : 'ממתין לתמונה'
                        : 'טקסט'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-200 truncate">{slide.text}</div>
                </div>
              ))}
            </div>
          </section>

          {/* עיצוב מתקדם — מכווץ כברירת מחדל */}
          <section className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setAdvancedOpen((open) => !open)}
              aria-expanded={advancedOpen}
              className="w-full flex items-center justify-between gap-2 px-3 py-3 bg-gray-50 dark:bg-gray-900/40 text-right hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="font-bold text-gray-800 dark:text-gray-200">עיצוב מתקדם</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                {advancedOpen ? 'הסתר ▲' : 'הצג ▼'}
              </span>
            </button>

            {advancedOpen && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col gap-1.5 mb-3" role="tablist" aria-label="פאנלי עיצוב">
                  {(
                    [
                      { id: 'layout' as const, label: 'פריסת קרוסלה' },
                      { id: 'slide-template' as const, label: 'תבנית שקף' },
                      { id: 'font' as const, label: 'גופן' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={advancedPanel === tab.id}
                      onClick={() => setAdvancedPanel(tab.id)}
                      className={`w-full px-3 py-2 rounded text-sm font-semibold text-right transition-colors ${
                        advancedPanel === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {advancedPanel === 'layout' && (
                  <div role="tabpanel">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      קובעת באילו שקפים יהיה מקום לתמונה — בלי למחוק את הטקסט
                    </p>
                    <div className="flex flex-col gap-2">
                      {CAROUSEL_LAYOUT_PRESETS.map((preset) => {
                        const isActive = carouselLayoutPreset === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyLayoutPreset(preset.id)}
                            className={`w-full px-3 py-2.5 rounded border text-right transition-colors ${
                              isActive
                                ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-400'
                                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                          >
                            <div className="text-sm font-semibold">{preset.label}</div>
                            <div className="text-[11px] mt-0.5 opacity-80">{preset.hint}</div>
                          </button>
                        );
                      })}
                      {carouselLayoutPreset === 'custom' && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded px-2 py-1.5">
                          פריסה מותאמת אישית — שינית תבניות לשקפים בודדים
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        ערכת צבעי שקפים
                      </h4>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        aria-pressed={isCanvasDark}
                        className={`w-full px-4 py-2.5 rounded font-semibold transition-all duration-300 shadow-sm border text-sm ${
                          isCanvasDark
                            ? 'bg-gray-100 text-gray-900 border-gray-300 hover:bg-white'
                            : 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
                        }`}
                      >
                        {isCanvasDark ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
                      </button>
                    </div>
                  </div>
                )}

                {advancedPanel === 'slide-template' && (
                  <div role="tabpanel">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      עיצוב ויזואלי לשקף {activeSlideIndex + 1} בלבד
                    </p>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      מומלצות
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {RECOMMENDED_TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSlideTemplate(activeSlideIndex, t.id)}
                          className={`px-2 py-2 text-sm rounded border text-right transition-colors ${
                            activeSlideTemplate === t.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-400'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {(showMoreTemplates || activeTemplateIsMore) && (
                      <div className="flex flex-col gap-3 mb-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                            עם תמונה
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {MORE_TEMPLATES.filter((t) => isImageTemplate(t.id)).map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setSlideTemplate(activeSlideIndex, t.id)}
                                className={`px-2 py-2 text-sm rounded border text-right transition-colors ${
                                  activeSlideTemplate === t.id
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-400'
                                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600'
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                            בלי תמונה
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {MORE_TEMPLATES.filter((t) => !isImageTemplate(t.id)).map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setSlideTemplate(activeSlideIndex, t.id)}
                                className={`px-2 py-2 text-sm rounded border text-right transition-colors ${
                                  activeSlideTemplate === t.id
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-400'
                                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600'
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowMoreTemplates((v) => !v)}
                      className="w-full px-3 py-2 text-sm font-semibold rounded border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {showMoreTemplates ? 'הסתר תבניות נוספות' : 'עוד תבניות'}
                    </button>
                  </div>
                )}

                {advancedPanel === 'font' && (
                  <div role="tabpanel">
                    <div className="flex flex-col gap-2">
                      {FONT_OPTIONS.map((font) => (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => setGlobalFont(font.id)}
                          className={`w-full px-3 py-2.5 rounded border text-right transition-colors flex items-center justify-between gap-3 ${
                            globalFont === font.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span
                            className="text-base text-gray-900 dark:text-gray-100"
                            style={{ fontFamily: `"${font.id}", sans-serif` }}
                          >
                            {font.label}
                          </span>
                          <span
                            className="text-sm text-gray-500 dark:text-gray-300 shrink-0"
                            style={{ fontFamily: `"${font.id}", sans-serif` }}
                          >
                            שלום
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <CopilotWidget
                    slides={localSlides}
                    template={activeSlideTemplate}
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
                    onChangeTemplate={handleChangeTemplateFromCopilot}
                    onChangeFont={(font) => setGlobalFont(font)}
                    onChangeColors={(color, newTheme) => {
                      if (color) setActiveBrandColor(color);
                      if (newTheme === 'light' || newTheme === 'dark') setTheme(newTheme);
                    }}
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Central Stage */}
      <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
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

        {/* Canvas Area — background follows canvas theme (not next-themes) */}
        <div
          className={`flex-1 flex justify-center items-center p-8 overflow-auto relative transition-colors duration-300 ${
            isCanvasDark ? 'bg-gray-950' : 'bg-gray-200'
          }`}
        >
          {localSlides.map((slide, i) => (
            <div
              key={`canvas-${i}-${slide.id}`}
              className={`transition-opacity duration-300 ${i === activeSlideIndex ? 'block opacity-100' : 'hidden opacity-0'}`}
            >
              <canvas
                ref={(el) => {
                  canvasRefs.current[i] = el;
                }}
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
          <SlideEditor
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
                onImageUpload={handleSlideImageUpload}
                onImageClear={handleSlideImageClear}
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
