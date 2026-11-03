// Opens a statement PDF in the browser (nothing is uploaded) and reads its transactions.
// pdf.js is loaded only when someone actually scans a file.
import { parseTransactions, type Cell, type Txn } from '../lib/statement';

export type StatementRead =
  | { ok: true; pages: number; txns: Txn[] }
  | { ok: false; reason: 'needs-password' | 'wrong-password' | 'unreadable' | 'no-transactions' };

export async function readStatement(file: File, password: string): Promise<StatementRead> {
  const pdfjs = await import('pdfjs-dist');
  const { default: workerSrc } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), password: password || undefined });
  try {
    const doc = await task.promise;
    const lines: Cell[][] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      lines.push(...toLines(content.items));
      page.cleanup();
    }
    const txns = parseTransactions(lines);
    // A scanned (photo) statement has no text to read
    if (!txns.length) return { ok: false, reason: 'no-transactions' };
    return { ok: true, pages: doc.numPages, txns };
  } catch (e) {
    if (e instanceof pdfjs.PasswordException) {
      return { ok: false, reason: e.code === pdfjs.PasswordResponses.NEED_PASSWORD ? 'needs-password' : 'wrong-password' };
    }
    return { ok: false, reason: 'unreadable' };
  } finally {
    task.destroy().catch(() => {});
  }
}

interface TextBit {
  str: string;
  transform: number[];
  width: number;
}

/** Groups a page's text pieces into lines (same height on the page), then into cells left to right */
function toLines(items: unknown[]): Cell[][] {
  const bits = (items as TextBit[]).filter((i) => typeof i.str === 'string' && i.str.trim());
  const rows: { y: number; bits: TextBit[] }[] = [];
  for (const b of bits) {
    const y = b.transform[5];
    const row = rows.find((r) => Math.abs(r.y - y) < 2.5);
    if (row) row.bits.push(b);
    else rows.push({ y, bits: [b] });
  }
  // PDF y grows upwards: top of the page first
  rows.sort((a, b) => b.y - a.y);
  return rows.map((r) => {
    const sorted = r.bits.sort((a, b) => a.transform[4] - b.transform[4]);
    const cells: Cell[] = [];
    for (const b of sorted) {
      const x = b.transform[4];
      const last = cells[cells.length - 1];
      // Pieces of the same word or phrase sit right next to each other
      if (last && x - (last.x + last.w) < 2) {
        last.text += (x - (last.x + last.w) > 0.5 ? ' ' : '') + b.str;
        last.w = x + b.width - last.x;
      } else {
        cells.push({ x, w: b.width, text: b.str });
      }
    }
    return cells.map((c) => ({ ...c, text: c.text.trim() }));
  });
}
