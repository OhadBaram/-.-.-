/** Darken a hex colour by amount (0–255). */
export function darkenHex(hex: string, amount = 60): string {
  const c = hex.replace('#', '');
  const r = Math.max(0, parseInt(c.substring(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(c.substring(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(c.substring(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
export interface SlideOverride {
  fontSize?: number;
  textY?: number;
  /** רקע שקף מפלטת המשתמש — גובר על ברירת בהיר/כהה */
  surfaceBg?: string;
}

export function resolveSurfaceBg(
  isDark: boolean,
  override?: SlideOverride,
  light = '#ffffff',
  dark = '#111827'
): string {
  if (override?.surfaceBg) return override.surfaceBg;
  return isDark ? dark : light;
}

/**
 * object-fit: cover עם נקודת מיקוד.
 * focalX / focalY: 0 = התחלה (שמאל/למעלה), 0.5 = מרכז, 1 = סוף.
 * ברירת מחדל אנכית למעלה — שומרת על ראשים בתמונות אנשים.
 */
export function coverFitRect(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number,
  focalX = 0.5,
  focalY = 0
): { renderW: number; renderH: number; offsetX: number; offsetY: number } {
  if (!imgW || !imgH || !boxW || !boxH) {
    return { renderW: boxW, renderH: boxH, offsetX: 0, offsetY: 0 };
  }
  const imgRatio = imgW / imgH;
  const boxRatio = boxW / boxH;
  let renderW = boxW;
  let renderH = boxH;
  let offsetX = 0;
  let offsetY = 0;
  if (imgRatio > boxRatio) {
    renderW = boxH * imgRatio;
    offsetX = (boxW - renderW) * focalX;
  } else {
    renderH = boxW / imgRatio;
    offsetY = (boxH - renderH) * focalY;
  }
  return { renderW, renderH, offsetX, offsetY };
}

/** RTL word-wrap: returns array of wrapped lines. */
export function wrapText(
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
export function drawWrappedText(
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

export function drawMinimal(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override?: SlideOverride,
  fontFamily: string = 'Heebo, sans-serif'
) {
  const bg = resolveSurfaceBg(isDark, override, '#ffffff', '#111827');
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
  ctx.font = `bold ${fs}px ${fontFamily}`;
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
    ctx.font = `${bodyFs}px ${fontFamily}`;
    ctx.fillStyle = isDark ? '#d1d5db' : '#374151';
    drawWrappedText(ctx, body, W / 2, accentY + 60, W - 160, bodyLh);
  }
}

export function drawBold(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override?: SlideOverride,
  fontFamily: string = 'Heebo, sans-serif'
) {
  const bg = resolveSurfaceBg(isDark, override, '#f9fafb', '#111827');
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

  ctx.font = `bold ${fs}px ${fontFamily}`;
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
    ctx.font = `${bodyFs}px ${fontFamily}`;
    ctx.fillStyle = fg;
    drawWrappedText(ctx, body, W / 2, startY + bandHeight / 2 + 60, W - 160, bodyLh);
  }
}

export function drawGradient(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override?: SlideOverride,
  fontFamily: string = 'Heebo, sans-serif'
) {
  const top = isDark ? darkenHex(brandColor, 90) : brandColor;
  const bottom = isDark ? darkenHex(brandColor, 140) : darkenHex(brandColor, 70);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const fs = override?.fontSize ?? 66;
  const lh = Math.round(fs * 1.27);
  const startY = override?.textY !== undefined ? (H * override.textY) / 100 : H / 2 - 60;

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fs}px ${fontFamily}`;
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, text, W / 2, startY, W - 140, lh);
}

export function drawDarkLuxury(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  _brandColor: string,
  isDark: boolean,
  override?: SlideOverride,
  fontFamily: string = 'Heebo, sans-serif'
) {
  const gold = '#D4AF37';
  const bg = resolveSurfaceBg(isDark, override, '#f7f3e8', '#0a0a0a');
  const fg = isDark ? '#ffffff' : '#1a1a1a';
  ctx.fillStyle = bg;
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

  ctx.fillStyle = fg;
  ctx.font = `bold ${fs}px serif`;
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, text, W / 2, startY, W - 200, lh);

  const lines = wrapText(ctx, text, W - 200);
  const endY  = startY + lines.length * lh;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2 - 100, endY + 20); ctx.lineTo(W / 2 + 100, endY + 20); ctx.stroke();
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override?: SlideOverride,
  fontFamily: string = 'Heebo, sans-serif'
) {
  const bg = resolveSurfaceBg(isDark, override, '#ffffff', '#111827');
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
  ctx.font = `bold ${fs}px ${fontFamily}`;
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, text, W / 2, startY, W - 160, lh);
}

export function drawSplit(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  slideIndex: number,
  override?: SlideOverride,
  fontFamily: string = 'Heebo, sans-serif'
) {
  const splitY = H * 0.4;
  ctx.fillStyle = brandColor;
  ctx.fillRect(0, 0, W, splitY);
  ctx.fillStyle = isDark ? '#1f2937' : '#ffffff';
  ctx.fillRect(0, splitY, W, H - splitY);

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `bold 140px ${fontFamily}`;
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(slideIndex + 1).padStart(2, '0'), W / 2, splitY / 2);

  const fs = override?.fontSize ?? 58;
  const lh = Math.round(fs * 1.31);
  const startY = override?.textY !== undefined ? (H * override.textY) / 100 : splitY + 80;

  ctx.fillStyle = isDark ? '#f9fafb' : '#111827';
  ctx.font = `bold ${fs}px ${fontFamily}`;
  drawWrappedText(ctx, text, W / 2, startY, W - 140, lh);
}

export function drawStory(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override?: SlideOverride,
  fontFamily: string = 'Heebo, sans-serif'
) {
  ctx.fillStyle = isDark ? darkenHex(brandColor, 50) : brandColor;
  ctx.fillRect(0, 0, W, H);

  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.05)');
  overlay.addColorStop(1, isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.55)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  const fs = override?.fontSize ?? 72;
  const lh = Math.round(fs * 1.25);
  const startY = override?.textY !== undefined ? (H * override.textY) / 100 : H / 2 - 60;

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fs}px ${fontFamily}`;
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, text, W / 2, startY, W - 120, lh);
}

export function drawQuote(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override?: SlideOverride,
  fontFamily: string = 'Heebo, sans-serif'
) {
  const bg = resolveSurfaceBg(isDark, override, '#ffffff', '#111827');
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

export function drawNumbered(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  slideIndex: number,
  override?: SlideOverride,
  fontFamily: string = 'Heebo, sans-serif'
) {
  const bg = resolveSurfaceBg(isDark, override, '#ffffff', '#111827');
  const fg = isDark ? '#f9fafb' : '#111827';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = fg;
  ctx.globalAlpha = 0.08;
  ctx.font = `bold 700px ${fontFamily}`;
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
  ctx.font = `bold ${fs}px ${fontFamily}`;
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, text, W / 2, startY, W - 140, lh);
}

export function drawMagazine(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override?: SlideOverride,
  fontFamily: string = 'Heebo, sans-serif'
) {
  const bg = resolveSurfaceBg(isDark, override, '#ffffff', '#111827');
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
  ctx.font = `bold ${fs}px ${fontFamily}`;
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
    ctx.font = `${bodyFs}px ${fontFamily}`;
    ctx.fillStyle = isDark ? '#d1d5db' : '#4b5563';
    const bodyLines = wrapText(ctx, body, W - 140);
    let by = y + 60;
    bodyLines.forEach(line => { ctx.fillText(line, W / 2, by); by += bodyLh; });
  }
}

export function drawWaves(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override?: SlideOverride,
  fontFamily: string = 'Heebo, sans-serif'
) {
  const bg = resolveSurfaceBg(isDark, override, '#ffffff', '#111827');
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
  ctx.font = `bold ${fs}px ${fontFamily}`;
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, text, W / 2, startY, W - 140, lh);
}

export function drawNeon(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override?: SlideOverride,
  fontFamily: string = 'Heebo, sans-serif'
) {
  ctx.fillStyle = isDark ? '#000000' : '#f3f4f6';
  ctx.fillRect(0, 0, W, H);

  const fs = override?.fontSize ?? 70;
  const lh = Math.round(fs * 1.25);
  const startY = override?.textY !== undefined ? (H * override.textY) / 100 : H / 2 - 60;

  ctx.shadowColor = brandColor;
  ctx.shadowBlur = isDark ? 30 : 12;
  ctx.fillStyle = isDark ? '#ffffff' : brandColor;
  ctx.font = `bold ${fs}px ${fontFamily}`;
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, text, W / 2, startY, W - 140, lh);
  ctx.shadowBlur = 0;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------



export async function drawImageSplit(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override: SlideOverride = {},
  imageUrl?: string,
  fontFamily: string = 'Heebo, sans-serif',
  shouldAbort?: () => boolean
): Promise<void> {
  const splitY = H * 0.65;

  // Draw background image or placeholder
  if (imageUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
    if (shouldAbort?.()) return;
    // cover עם מיקוד עליון — לא חותך ראשים כמו center
    const { renderW, renderH, offsetX, offsetY } = coverFitRect(
      img.width,
      img.height,
      W,
      splitY,
      0.5,
      0
    );
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, splitY);
    ctx.clip();
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    ctx.restore();
  } else {
    drawImagePlacementMarker(ctx, 0, 0, W, splitY, isDark, fontFamily);
    strokeImagePlacementOutline(ctx, 0, 0, W, splitY, isDark);
  }

  // Draw bottom split — darken brand panel in canvas dark mode
  ctx.fillStyle = isDark ? darkenHex(brandColor, 55) : brandColor;
  ctx.fillRect(0, splitY, W, H - splitY);

  // Draw Text
  const fontSize = override.fontSize ?? 64;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = '#ffffff'; // White text on brand color
  
  // Custom Y or default to center of bottom split
  const defaultTextY = splitY + ((H - splitY) / 2);
  const textY = override.textY !== undefined ? (H * (override.textY / 100)) : defaultTextY;
  
  drawWrappedText(ctx, text, W / 2, textY, W * 0.85, fontSize * 1.4);
}

/** Builds a clip path only (no clip()). Used by drawImageOrPlaceholder. */
type ClipPathBuilder = () => void;

function drawCameraGlyph(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  color: string
) {
  const bodyW = 70 * scale;
  const bodyH = 48 * scale;
  const lensR = 14 * scale;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, 3 * scale);
  ctx.lineJoin = 'round';

  ctx.strokeRect(cx - bodyW / 2, cy - bodyH / 2, bodyW, bodyH);
  ctx.beginPath();
  ctx.arc(cx, cy + 2 * scale, lensR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillRect(cx - 14 * scale, cy - bodyH / 2 - 10 * scale, 28 * scale, 10 * scale);
}

function drawImagePlacementMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isDark: boolean,
  fontFamily: string,
  buildPath?: ClipPathBuilder
) {
  const accent = isDark ? '#9ca3af' : '#64748b';
  const fill = isDark ? '#1f2937' : '#e2e8f0';
  const labelFs = Math.max(22, Math.min(40, Math.floor(Math.min(w, h) * 0.06)));
  const iconScale = Math.max(0.55, Math.min(1.2, Math.min(w, h) / 500));

  // Fill (clipped by caller when buildPath is used)
  ctx.fillStyle = fill;
  if (buildPath) {
    buildPath();
    ctx.fill();
  } else {
    ctx.fillRect(x, y, w, h);
  }

  const cx = x + w / 2;
  const cy = y + h / 2 - labelFs * 0.55;
  drawCameraGlyph(ctx, cx, cy, iconScale, accent);

  const bodyH = 48 * iconScale;
  ctx.fillStyle = accent;
  ctx.font = `bold ${labelFs}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.direction = 'rtl';
  ctx.fillText('כאן תופיע התמונה', cx, cy + bodyH / 2 + 14 * iconScale);
}

function strokeImagePlacementOutline(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isDark: boolean,
  buildPath?: ClipPathBuilder
) {
  const accent = isDark ? '#9ca3af' : '#64748b';
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.01);
  ctx.setLineDash([16, 12]);
  if (buildPath) {
    buildPath();
    ctx.stroke();
  } else {
    const inset = Math.max(10, Math.min(w, h) * 0.025);
    ctx.strokeRect(x + inset, y + inset, w - inset * 2, h - inset * 2);
  }
  ctx.restore();
}

export async function drawImageOrPlaceholder(
  ctx: CanvasRenderingContext2D,
  imageUrl: string | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  isDark: boolean,
  clipPath?: ClipPathBuilder,
  fontFamily: string = 'Heebo, sans-serif',
  shouldAbort?: () => boolean
) {
  ctx.save();
  if (clipPath) {
    clipPath();
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
  }

  if (imageUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
    if (shouldAbort?.()) {
      ctx.restore();
      return;
    }
    
    let renderW = w;
    let renderH = h;
    let offsetX = 0;
    let offsetY = 0;
    if (img.width && img.height) {
      // מיקוד עליון — מונע חיתוך ראשים ב־cover ממורכז
      ({ renderW, renderH, offsetX, offsetY } = coverFitRect(
        img.width,
        img.height,
        w,
        h,
        0.5,
        0
      ));
    }
    ctx.drawImage(img, x + offsetX, y + offsetY, renderW, renderH);
    ctx.restore();
  } else {
    drawImagePlacementMarker(ctx, x, y, w, h, isDark, fontFamily, clipPath);
    ctx.restore();
    // Outline after restore so dashed border isn't half-clipped away
    strokeImagePlacementOutline(ctx, x, y, w, h, isDark, clipPath);
  }
}

export async function drawImageFullDark(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override: SlideOverride = {},
  imageUrl?: string, fontFamily: string = 'Heebo, sans-serif', shouldAbort?: () => boolean
): Promise<void> {
  await drawImageOrPlaceholder(ctx, imageUrl, 0, 0, W, H, isDark, undefined, fontFamily, shouldAbort);
  if (shouldAbort?.()) return;
  
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, isDark ? 'rgba(0,0,0,0.88)' : 'rgba(0,0,0,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = isDark ? darkenHex(brandColor, 40) : brandColor;
  ctx.fillRect(0, H - 16, W, 16);

  const fontSize = override.fontSize ?? 64;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  const defaultTextY = H * 0.75;
  const textY = override.textY !== undefined ? (H * (override.textY / 100)) : defaultTextY;
  
  drawWrappedText(ctx, text, W / 2, textY, W * 0.85, fontSize * 1.4);
}

export async function drawImageCircle(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override: SlideOverride = {},
  imageUrl?: string, fontFamily: string = 'Heebo, sans-serif', shouldAbort?: () => boolean
): Promise<void> {
  ctx.fillStyle = isDark ? darkenHex(brandColor, 50) : brandColor;
  ctx.fillRect(0, 0, W, H);

  const radius = 250;
  const cx = W / 2;
  const cy = H * 0.35;

  await drawImageOrPlaceholder(ctx, imageUrl, cx - radius, cy - radius, radius * 2, radius * 2, isDark, () => {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  }, fontFamily, shouldAbort);
  if (shouldAbort?.()) return;

  const fontSize = override.fontSize ?? 64;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  const defaultTextY = cy + radius + 100;
  const textY = override.textY !== undefined ? (H * (override.textY / 100)) : defaultTextY;
  
  drawWrappedText(ctx, text, W / 2, textY, W * 0.85, fontSize * 1.4);
}

export async function drawImageSplitBottom(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override: SlideOverride = {},
  imageUrl?: string, fontFamily: string = 'Heebo, sans-serif', shouldAbort?: () => boolean
): Promise<void> {
  const splitY = H * 0.35;
  
  ctx.fillStyle = isDark ? darkenHex(brandColor, 50) : brandColor;
  ctx.fillRect(0, 0, W, splitY);
  
  await drawImageOrPlaceholder(ctx, imageUrl, 0, splitY, W, H - splitY, isDark, undefined, fontFamily, shouldAbort);
  if (shouldAbort?.()) return;

  const fontSize = override.fontSize ?? 64;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  const defaultTextY = splitY / 2;
  const textY = override.textY !== undefined ? (H * (override.textY / 100)) : defaultTextY;
  
  drawWrappedText(ctx, text, W / 2, textY, W * 0.85, fontSize * 1.4);
}

export async function drawImagePolaroid(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override: SlideOverride = {},
  imageUrl?: string, fontFamily: string = 'Heebo, sans-serif', shouldAbort?: () => boolean
): Promise<void> {
  const bg = resolveSurfaceBg(isDark, override, '#f9fafb', '#111827');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const pw = W * 0.8;
  const ph = H * 0.75;
  const px = (W - pw) / 2;
  const py = (H - ph) / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 15;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();

  const margin = 40;
  const bottomMargin = 250;
  const imgW = pw - margin * 2;
  const imgH = ph - margin - bottomMargin;
  
  await drawImageOrPlaceholder(ctx, imageUrl, px + margin, py + margin, imgW, imgH, isDark, undefined, fontFamily, shouldAbort);
  if (shouldAbort?.()) return;

  const fontSize = override.fontSize ?? 48;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = '#111827';
  ctx.textBaseline = 'middle';
  const defaultTextY = py + margin + imgH + (bottomMargin / 2);
  const textY = override.textY !== undefined ? (H * (override.textY / 100)) : defaultTextY;
  
  drawWrappedText(ctx, text, W / 2, textY, imgW * 0.9, fontSize * 1.4);
}

export async function drawImageSide(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override: SlideOverride = {},
  imageUrl?: string, fontFamily: string = 'Heebo, sans-serif', shouldAbort?: () => boolean
): Promise<void> {
  ctx.fillStyle = isDark ? darkenHex(brandColor, 50) : brandColor;
  ctx.fillRect(0, 0, W / 2, H);

  await drawImageOrPlaceholder(ctx, imageUrl, W / 2, 0, W / 2, H, isDark, undefined, fontFamily, shouldAbort);
  if (shouldAbort?.()) return;

  const fontSize = override.fontSize ?? 54;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  const defaultTextY = H / 2;
  const textY = override.textY !== undefined ? (H * (override.textY / 100)) : defaultTextY;
  
  drawWrappedText(ctx, text, W / 4, textY, (W / 2) * 0.8, fontSize * 1.4);
}

export async function drawImageMagazine(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override: SlideOverride = {},
  imageUrl?: string, fontFamily: string = 'Heebo, sans-serif', shouldAbort?: () => boolean
): Promise<void> {
  const splitY = H * 0.8;
  
  const bg = resolveSurfaceBg(isDark, override, '#ffffff', '#111827');
  ctx.fillStyle = bg;
  ctx.fillRect(0, splitY, W, H - splitY);

  await drawImageOrPlaceholder(ctx, imageUrl, 0, 0, W, splitY, isDark, undefined, fontFamily, shouldAbort);
  if (shouldAbort?.()) return;

  const fontSize = override.fontSize ?? 90;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = brandColor;
  ctx.textBaseline = 'middle';
  const defaultTextY = splitY;
  const textY = override.textY !== undefined ? (H * (override.textY / 100)) : defaultTextY;
  
  drawWrappedText(ctx, text, W / 2, textY, W * 0.9, fontSize * 1.2);
}

export async function drawImageOverlay(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override: SlideOverride = {},
  imageUrl?: string, fontFamily: string = 'Heebo, sans-serif', shouldAbort?: () => boolean
): Promise<void> {
  await drawImageOrPlaceholder(ctx, imageUrl, 0, 0, W, H, isDark, undefined, fontFamily, shouldAbort);
  if (shouldAbort?.()) return;
  
  ctx.globalAlpha = isDark ? 0.72 : 0.5;
  ctx.fillStyle = isDark ? darkenHex(brandColor, 60) : brandColor;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1.0;

  const fontSize = override.fontSize ?? 72;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  const defaultTextY = H / 2;
  const textY = override.textY !== undefined ? (H * (override.textY / 100)) : defaultTextY;
  
  drawWrappedText(ctx, text, W / 2, textY, W * 0.85, fontSize * 1.4);
}

export async function drawImageArch(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string,
  brandColor: string,
  isDark: boolean,
  override: SlideOverride = {},
  imageUrl?: string, fontFamily: string = 'Heebo, sans-serif', shouldAbort?: () => boolean
): Promise<void> {
  const bg = resolveSurfaceBg(isDark, override, '#f9fafb', '#111827');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const archW = W * 0.7;
  const archH = H * 0.6;
  const ax = (W - archW) / 2;
  const ay = H * 0.1;
  const radius = archW / 2;

  await drawImageOrPlaceholder(ctx, imageUrl, ax, ay, archW, archH, isDark, () => {
    ctx.beginPath();
    ctx.moveTo(ax, ay + radius);
    ctx.arcTo(ax, ay, ax + radius, ay, radius);
    ctx.arcTo(ax + archW, ay, ax + archW, ay + radius, radius);
    ctx.lineTo(ax + archW, ay + archH);
    ctx.lineTo(ax, ay + archH);
    ctx.closePath();
  }, fontFamily, shouldAbort);
  if (shouldAbort?.()) return;

  const fontSize = override.fontSize ?? 60;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = isDark ? '#f9fafb' : '#111827';
  ctx.textBaseline = 'middle';
  const defaultTextY = ay + archH + 100;
  const textY = override.textY !== undefined ? (H * (override.textY / 100)) : defaultTextY;
  
  drawWrappedText(ctx, text, W / 2, textY, W * 0.85, fontSize * 1.4);
}
