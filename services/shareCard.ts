/**
 * Draws a before/after card (1080x1350, the Instagram and TikTok portrait size) and shares it,
 * or downloads it when the Web Share API cannot share files.
 */
const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });

const cover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, r: number) => {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
  const s = Math.max(w / img.width, h / img.height);
  const iw = img.width * s;
  const ih = img.height * s;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  ctx.restore();
};

export interface ShareCardInput {
  before: string;
  after: string;
  beforeScore: number;
  afterScore: number;
  beforeLabel: string;
  afterLabel: string;
  title: string;
}

export const drawShareCard = async (d: ShareCardInput): Promise<Blob> => {
  const c = document.createElement('canvas');
  c.width = 1080;
  c.height = 1350;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, c.width, c.height);
  const font = (w: number, px: number) => `${w} ${px}px Onest, system-ui, sans-serif`;

  ctx.fillStyle = '#0E2B2E';
  ctx.font = font(600, 64);
  ctx.fillText(d.title, 72, 150);

  const [a, b] = await Promise.all([loadImg(d.before), loadImg(d.after)]);
  const w = 456;
  const h = 640;
  cover(ctx, a, 72, 230, w, h, 40);
  cover(ctx, b, 72 + w + 24, 230, w, h, 40);

  const label = (x: number, text: string, score: number, color: string) => {
    ctx.fillStyle = '#6E8283';
    ctx.font = font(500, 34);
    ctx.fillText(text, x, 930);
    ctx.fillStyle = color;
    ctx.font = font(600, 96);
    ctx.fillText(String(score), x, 1040);
  };
  label(72, d.beforeLabel, d.beforeScore, '#0E2B2E');
  label(72 + w + 24, d.afterLabel, d.afterScore, d.afterScore >= d.beforeScore ? '#2E8C68' : '#D2432F');

  const delta = d.afterScore - d.beforeScore;
  if (delta !== 0) {
    ctx.fillStyle = delta > 0 ? 'rgba(46,140,104,0.12)' : 'rgba(210,67,47,0.12)';
    ctx.beginPath();
    ctx.roundRect(72 + w + 24 + 220, 975, 190, 80, 40);
    ctx.fill();
    ctx.fillStyle = delta > 0 ? '#2E8C68' : '#D2432F';
    ctx.font = font(600, 44);
    ctx.fillText(`${delta > 0 ? '+' : ''}${delta}`, 72 + w + 24 + 260, 1030);
  }

  try {
    const logo = await loadImg('/icon.svg');
    ctx.drawImage(logo, 72, 1170, 100, 100);
  } catch { /* logo optional */ }
  ctx.fillStyle = '#0E2B2E';
  ctx.font = font(600, 44);
  ctx.fillText('scanything', 196, 1218);
  ctx.fillStyle = '#6E8283';
  ctx.font = font(400, 30);
  ctx.fillText('scanything.online', 196, 1262);

  return new Promise((resolve) => c.toBlob((bl) => resolve(bl!), 'image/png'));
};

/** Returns 'shared', 'downloaded' or 'cancelled'. */
export const shareBlob = async (blob: Blob, filename: string): Promise<'shared' | 'downloaded' | 'cancelled'> => {
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as any;
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file] });
      return 'shared';
    } catch {
      return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
};
