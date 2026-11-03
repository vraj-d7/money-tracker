// Draws a shareable result card as a 1080×1350 PNG (Instagram's 4:5), matching the on-screen preview.
export interface ShareCard {
  tag: string;
  title: string;
  /** Leave empty to keep numbers off the card */
  amount: string;
  /** Shown instead of the amount */
  alt: string;
}

const W = 1080;
const H = 1350;
const INK = '#15131C';
const PAPER = '#FAF6EE';
const MANGO = '#FFB21E';
const MINT = '#2ED3A0';
const DISPLAY = "'Bricolage Grotesque', sans-serif";
const BODY = 'Inter, system-ui, sans-serif';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// Wrap text to a max width, returning the lines
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Handy's coin face, simplified
function drawCoin(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.fillStyle = MANGO;
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = r * 0.1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  for (const dx of [-0.32, 0.32]) {
    ctx.beginPath();
    ctx.ellipse(cx + dx * r, cy - 0.12 * r, r * 0.1, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = r * 0.11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy + 0.08 * r, r * 0.38, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
}

export async function drawShareCard(card: ShareCard): Promise<Blob> {
  // Make sure the brand fonts are ready before drawing text
  await Promise.all([document.fonts.load(`800 100px ${DISPLAY}`), document.fonts.load(`800 40px ${BODY}`)]).catch(() => {});

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  // Mango glow, top right
  const glow = ctx.createRadialGradient(W - 100, 100, 0, W - 100, 100, 600);
  glow.addColorStop(0, 'rgba(255,178,30,0.35)');
  glow.addColorStop(0.7, 'rgba(255,178,30,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const pad = 90;

  // Tag pill
  ctx.font = `800 40px ${BODY}`;
  const tagW = ctx.measureText(card.tag).width + 56;
  roundRect(ctx, pad, pad, tagW, 72, 36);
  ctx.strokeStyle = MANGO;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = MANGO;
  ctx.textBaseline = 'middle';
  ctx.fillText(card.tag, pad + 28, pad + 38);

  // Title + amount, vertically centred
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 104px ${DISPLAY}`;
  const titleLines = wrap(ctx, card.title, W - pad * 2);
  const second = card.amount || card.alt;
  const secondSize = card.amount ? 128 : 76;
  const blockH = titleLines.length * 112 + 24 + secondSize;
  let y = H / 2 - blockH / 2 + 104;
  ctx.fillStyle = PAPER;
  for (const l of titleLines) {
    ctx.fillText(l, pad, y);
    y += 112;
  }
  y += 24 + secondSize - 104;
  ctx.fillStyle = MINT;
  ctx.font = `800 ${secondSize}px ${BODY}`;
  for (const l of wrap(ctx, second, W - pad * 2)) {
    ctx.fillText(l, pad, y);
    y += secondSize * 1.1;
  }

  // Footer: wordmark + Handy
  drawCoin(ctx, pad + 40, H - pad - 40, 40);
  ctx.fillStyle = PAPER;
  ctx.font = `800 64px ${DISPLAY}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('Inhandy', pad + 100, H - pad - 36);
  drawCoin(ctx, W - pad - 90, H - pad - 90, 90);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create image'))), 'image/png'),
  );
}
