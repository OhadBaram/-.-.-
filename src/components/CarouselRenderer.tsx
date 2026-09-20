'use client';

import React, { useRef, useState, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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

/** Darken a hex colour by `amount` (0–255). */
function darkenHex(hex: string, amount = 60): string {
  const c = hex.replace('#', '');
  const r = Math.max(0, parseInt(c.substring(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(c.substring(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(c.substring(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** RTL word-wrap: returns array of wrapped lines. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (let i = 0; i < words.length; i++) {
    const test = current ? current + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = words[i];
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Draw RTL wrapped lines with centre alignment starting at `startY`. */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
): void {
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  const lines = wrapText(ctx, text, maxWidth);
  lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + i * lineHeight);
  });
}

// ---------------------------------------------------------------------------
// Template draw functions
// ---------------------------------------------------------------------------

function drawMinimal(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override?: SlideOverride
) {
  const bg = isDark ? '#111827' : '#ffffff';
  const fg = isDark ? '#f9fafb' : '#111827';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const parts = text.split('\n');
  const title = parts[0] ?? text;
  const body  = parts.slice(1).join('\n');

  const fs = override?.fontSize ?? 72;
  const lh = Math.round(fs * 1.22);
  const startY = override?.textY !== undefined ? (H * override.textY) / 100 : H / 2 - 80;

  ctx.fillStyle = fg;
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, title, W / 2, startY, W - 160, lh);

  const titleLines = wrapText(ctx, title, W - 160);
  const accentY = startY + titleLines.length * lh - 20;
  ctx.strokeStyle = brandColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 120, accentY);
  ctx.lineTo(W / 2 + 120, accentY);
  ctx.stroke();

  if (body) {
    const bodyFs = Math.round(fs * (42 / 72));
    const bodyLh = Math.round(bodyFs * 1.33);
    ctx.font = `${bodyFs}px sans-serif`;
    ctx.fillStyle = isDark ? '#d1d5db' : '#374151';
    drawWrappedText(ctx, body, W / 2, accentY + 60, W - 160, bodyLh);
  }
}

function drawBold(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override?: SlideOverride
) {
  const bg = isDark ? '#111827' : '#f9fafb';
  const fg = isDark ? '#ffffff' : '#111827';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const parts = text.split('\n');
  const title = parts[0] ?? text;
  const body  = parts.slice(1).join('\n');

  const fs = override?.fontSize ?? 110;
  const startY = override?.textY !== undefined ? (H * override.textY) / 100 : H / 2 - 80;
  const bandHeight = Math.max(160, Math.round(fs * 1.45));

  ctx.fillStyle = brandColor;
  ctx.fillRect(0, startY - bandHeight / 2, W, bandHeight);

  ctx.font = `bold ${fs}px sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let headline = title;
  while (ctx.measureText(headline).width > W - 80 && headline.length > 0) {
    headline = headline.slice(0, -1);
  }
  ctx.fillText(headline, W / 2, startY);

  if (body) {
    const bodyFs = Math.round(fs * (44 / 110));
    const bodyLh = Math.round(bodyFs * 1.36);
    ctx.font = `${bodyFs}px sans-serif`;
    ctx.fillStyle = fg;
    drawWrappedText(ctx, body, W / 2, startY + bandHeight / 2 + 60, W - 160, bodyLh);
  }
}

function drawGradient(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  _isDark: boolean,
  override?: SlideOverride
) {
  const darker = darkenHex(brandColor, 70);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, brandColor);
  grad.addColorStop(1, darker);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const fs = override?.fontSize ?? 66;
  const lh = Math.round(fs * 1.27);
  const startY = override?.textY !== undefined ? (H * override.textY) / 100 : H / 2 - 60;

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, text, W / 2, startY, W - 140, lh);
}

function drawDarkLuxury(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  _brandColor: string,
  _isDark: boolean,
  override?: SlideOverride
) {
  const gold = '#D4AF37';
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  [[80, 80], [80, 96]].forEach(([x1, y1]) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(W - x1, y1); ctx.stroke();
  });
  [[80, H - 80], [80, H - 96]].forEach(([x1, y1]) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(W - x1, y1); ctx.stroke();
  });

  const fs = override?.fontSize ?? 66;
  const lh = Math.round(fs * 1.27);
  const startY = override?.textY !== undefined ? (H * override.textY) / 100 : H / 2 - 60;

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fs}px serif`;
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, text, W / 2, startY, W - 200, lh);

  const lines = wrapText(ctx, text, W - 200);
  const endY  = startY + lines.length * lh;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2 - 100, endY + 20); ctx.lineTo(W / 2 + 100, endY + 20); ctx.stroke();
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override?: SlideOverride
) {
  const bg = isDark ? '#111827' : '#ffffff';
  const fg = isDark ? '#f9fafb' : '#111827';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const bw = 20;
  ctx.strokeStyle = brandColor;
  ctx.lineWidth = bw;
  ctx.strokeRect(bw / 2, bw / 2, W - bw, H - bw);

  const fs = override?.fontSize ?? 66;
  const lh = Math.round(fs * 1.27);
  const startY = override?.textY !== undefined ? (H * override.textY) / 100 : H / 2 - 60;

  ctx.fillStyle = fg;
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, text, W / 2, startY, W - 160, lh);
}

function drawSplit(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  slideIndex: number,
  override?: SlideOverride
) {
  const splitY = H * 0.4;
  ctx.fillStyle = brandColor;
  ctx.fillRect(0, 0, W, splitY);
  ctx.fillStyle = isDark ? '#1f2937' : '#ffffff';
  ctx.fillRect(0, splitY, W, H - splitY);

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 140px sans-serif';
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(slideIndex + 1).padStart(2, '0'), W / 2, splitY / 2);

  const fs = override?.fontSize ?? 58;
  const lh = Math.round(fs * 1.31);
  const startY = override?.textY !== undefined ? (H * override.textY) / 100 : splitY + 80;

  ctx.fillStyle = isDark ? '#f9fafb' : '#111827';
  ctx.font = `bold ${fs}px sans-serif`;
  drawWrappedText(ctx, text, W / 2, startY, W - 140, lh);
}

function drawStory(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  _isDark: boolean,
  override?: SlideOverride
) {
  ctx.fillStyle = brandColor;
  ctx.fillRect(0, 0, W, H);

  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, 'rgba(0,0,0,0.1)');
  overlay.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  const fs = override?.fontSize ?? 72;
  const lh = Math.round(fs * 1.25);
  const startY = override?.textY !== undefined ? (H * override.textY) / 100 : H / 2 - 60;

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, text, W / 2, startY, W - 120, lh);
}

function drawQuote(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override?: SlideOverride
) {
  const bg = isDark ? '#111827' : '#ffffff';
  const fg = isDark ? '#f9fafb' : '#111827';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = brandColor;
  ctx.font = '240px serif';
  ctx.direction = 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.globalAlpha = 0.25;
  ctx.fillText('\u05F4', W / 2, 80);
  ctx.globalAlpha = 1;

  const fs = override?.fontSize ?? 60;
  const lh = Math.round(fs * 1.33);
  const startY = override?.textY !== undefined ? (H * override.textY) / 100 : H / 2 + 40;

  ctx.fillStyle = fg;
  ctx.font = `bold ${fs}px serif`;
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, text, W / 2, startY, W - 160, lh);
}

function drawNumbered(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  slideIndex: number,
  override?: SlideOverride
) {
  const bg = isDark ? '#111827' : '#ffffff';
  const fg = isDark ? '#f9fafb' : '#111827';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = fg;
  ctx.globalAlpha = 0.08;
  ctx.font = 'bold 700px sans-serif';
  ctx.direction = 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(slideIndex + 1), W / 2, H / 2);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = brandColor;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(W - 40, 80);
  ctx.lineTo(W - 40, H - 80);
  ctx.stroke();

  const fs = override?.fontSize ?? 62;
  const lh = Math.round(fs * 1.29);
  const startY = override?.textY !== undefined ? (H * override.textY) / 100 : H / 2 - 60;

  ctx.fillStyle = fg;
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, text, W / 2, startY, W - 140, lh);
}

function drawMagazine(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override?: SlideOverride
) {
  const bg = isDark ? '#111827' : '#ffffff';
  const fg = isDark ? '#f9fafb' : '#111827';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = brandColor;
  ctx.fillRect(W - 24, 0, 24, H);

  const parts = text.split('\n');
  const title = parts[0] ?? text;
  const body  = parts.slice(1).join('\n');

  const fs = override?.fontSize ?? 70;
  const lh = Math.round(fs * 1.25);
  let y = override?.textY !== undefined ? (H * override.textY) / 100 : 200;

  ctx.fillStyle = fg;
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const headLines = wrapText(ctx, title, W - 120);
  headLines.forEach(line => { ctx.fillText(line, W / 2, y); y += lh; });

  ctx.strokeStyle = isDark ? '#374151' : '#e5e7eb';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(100, y + 24);
  ctx.lineTo(W - 100, y + 24);
  ctx.stroke();

  if (body) {
    const bodyFs = Math.round(fs * (36 / 70));
    const bodyLh = Math.round(bodyFs * 1.44);
    ctx.font = `${bodyFs}px sans-serif`;
    ctx.fillStyle = isDark ? '#d1d5db' : '#4b5563';
    const bodyLines = wrapText(ctx, body, W - 140);
    let by = y + 60;
    bodyLines.forEach(line => { ctx.fillText(line, W / 2, by); by += bodyLh; });
  }
}

function drawWaves(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override?: SlideOverride
) {
  const bg = isDark ? '#111827' : '#ffffff';
  const fg = isDark ? '#f9fafb' : '#111827';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = brandColor;
  ctx.lineWidth = 8;
  ctx.globalAlpha = 0.6;
  const waves: [number, number, number, number, number, number, number][] = [
    [0, 160,  W*0.25, 60,   W*0.75, 260,  W],
    [0, 200,  W*0.25, 100,  W*0.75, 300,  W],
    [0, H-160, W*0.25, H-60,  W*0.75, H-260, W],
    [0, H-200, W*0.25, H-100, W*0.75, H-300, W],
  ];
  waves.forEach(([x0, y0, cx1, cy1, cx2, cy2, x3]) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x3, y0);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  const fs = override?.fontSize ?? 66;
  const lh = Math.round(fs * 1.27);
  const startY = override?.textY !== undefined ? (H * override.textY) / 100 : H / 2 - 60;

  ctx.fillStyle = fg;
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, text, W / 2, startY, W - 140, lh);
}

function drawNeon(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  _isDark: boolean,
  override?: SlideOverride
) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  const fs = override?.fontSize ?? 70;
  const lh = Math.round(fs * 1.25);
  const startY = override?.textY !== undefined ? (H * override.textY) / 100 : H / 2 - 60;

  ctx.shadowColor = brandColor;
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, text, W / 2, startY, W - 140, lh);
  ctx.shadowBlur = 0;
}

// ---------------------------------------------------------------------------
// Main component
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
