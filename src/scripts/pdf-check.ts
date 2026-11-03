// Opens a statement PDF in the browser (nothing is uploaded) to check it's readable and the password fits.
// pdf.js is loaded only when someone actually picks a file.
export type PdfCheck = { ok: true; pages: number } | { ok: false; reason: 'needs-password' | 'wrong-password' | 'unreadable' };

export async function checkPdf(file: File, password: string): Promise<PdfCheck> {
  const pdfjs = await import('pdfjs-dist');
  const { default: workerSrc } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data, password: password || undefined });
  try {
    const doc = await task.promise;
    return { ok: true, pages: doc.numPages };
  } catch (e) {
    if (e instanceof pdfjs.PasswordException) {
      return { ok: false, reason: e.code === pdfjs.PasswordResponses.NEED_PASSWORD ? 'needs-password' : 'wrong-password' };
    }
    return { ok: false, reason: 'unreadable' };
  } finally {
    task.destroy().catch(() => {});
  }
}
