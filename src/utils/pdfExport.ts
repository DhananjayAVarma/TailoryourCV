import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { ActiveDocument, TargetLength } from '../types/cv';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

export function buildPdfFilename(
  fullName: string,
  activeDocument: ActiveDocument
): string {
  const safeName = (fullName || 'TailorCV')
    .trim()
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .replace(/\s+/g, '_');
  const docLabel = activeDocument === 'cover-letter' ? 'Cover_Letter' : 'Resume';
  return `${safeName || 'TailorCV'}_${docLabel}.pdf`;
}

export async function exportDocumentToA4Pdf(options: {
  sourceElement: HTMLElement;
  filename: string;
  targetLength: TargetLength;
}): Promise<void> {
  const { sourceElement, filename, targetLength } = options;

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  // Create an off-screen render host at true 210mm width (zoom: 1) so mobile
  // preview scaling never shrinks the exported PDF.
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = `${A4_WIDTH_MM}mm`;
  host.style.margin = '0';
  host.style.padding = '0';
  host.style.backgroundColor = '#FFFFFF';
  host.style.pointerEvents = 'none';
  host.style.zIndex = '-1';

  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  clone.style.width = `${A4_WIDTH_MM}mm`;
  clone.style.zoom = '1';
  clone.style.backgroundColor = '#FFFFFF';
  clone.style.color = '#111827';

  if (targetLength === '1-page') {
    clone.style.height = `${A4_HEIGHT_MM}mm`;
    clone.style.maxHeight = `${A4_HEIGHT_MM}mm`;
    clone.style.minHeight = `${A4_HEIGHT_MM}mm`;
    clone.style.overflow = 'hidden';
  } else {
    clone.style.height = 'auto';
    clone.style.maxHeight = 'none';
    clone.style.minHeight = `${A4_HEIGHT_MM}mm`;
    clone.style.overflow = 'visible';
  }

  // Remove non-printable guides (e.g., Page 1 A4 boundary line)
  clone.querySelectorAll('.no-print').forEach((el) => el.remove());

  // Strip contenteditable markers so focus/hover styles never appear
  clone.querySelectorAll('[contenteditable]').forEach((el) => {
    el.removeAttribute('contenteditable');
  });

  // Convert CSS `zoom` on the inner scaling container to `transform: scale(...)`
  // so SVG foreignObject rendering scales identically across all browsers.
  const innerEl = clone.querySelector('[data-doc-inner="true"]') as HTMLElement | null;
  if (innerEl) {
    const overflowZoom = Number(innerEl.getAttribute('data-overflow-zoom') || '1');
    if (Number.isFinite(overflowZoom) && overflowZoom > 0 && overflowZoom < 1) {
      innerEl.style.zoom = '1';
      innerEl.style.transform = `scale(${overflowZoom})`;
      innerEl.style.transformOrigin = 'top left';
      innerEl.style.width = `${(100 / overflowZoom).toFixed(4)}%`;
    }
  }

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    // Allow browser layout & font metrics to settle on the cloned node
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

    const captureWidth = Math.ceil(clone.getBoundingClientRect().width) || 794;
    const captureHeight =
      targetLength === '1-page'
        ? Math.ceil(clone.getBoundingClientRect().height) || 1123
        : Math.max(
            Math.ceil(clone.getBoundingClientRect().height),
            clone.scrollHeight
          );

    const fullCanvas = await toCanvas(clone, {
      pixelRatio: 2,
      backgroundColor: '#FFFFFF',
      width: captureWidth,
      height: captureHeight,
      cacheBust: false,
      style: {
        margin: '0',
        zoom: '1',
      },
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const totalHeightMm = (fullCanvas.height / fullCanvas.width) * A4_WIDTH_MM;

    if (targetLength === '1-page' || totalHeightMm <= A4_HEIGHT_MM + 1.5) {
      const renderHeightMm = Math.min(A4_HEIGHT_MM, totalHeightMm);
      const dataUrl = fullCanvas.toDataURL('image/png');
      pdf.addImage(dataUrl, 'PNG', 0, 0, A4_WIDTH_MM, renderHeightMm, undefined, 'FAST');
    } else {
      const pageHeightPx = Math.floor(
        fullCanvas.width * (A4_HEIGHT_MM / A4_WIDTH_MM)
      );
      let offsetY = 0;
      let pageIndex = 0;

      while (offsetY < fullCanvas.height) {
        const sliceHeightPx = Math.min(pageHeightPx, fullCanvas.height - offsetY);
        // Skip tiny subpixel trailing artifacts (< 8px)
        if (pageIndex > 0 && sliceHeightPx < 8) {
          break;
        }

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = fullCanvas.width;
        sliceCanvas.height = sliceHeightPx;
        const ctx = sliceCanvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not initialize 2D canvas context for PDF slicing.');
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          fullCanvas,
          0,
          offsetY,
          fullCanvas.width,
          sliceHeightPx,
          0,
          0,
          fullCanvas.width,
          sliceHeightPx
        );

        const sliceHeightMm =
          (sliceHeightPx / fullCanvas.width) * A4_WIDTH_MM;
        if (pageIndex > 0) {
          pdf.addPage('a4', 'portrait');
        }

        pdf.addImage(
          sliceCanvas.toDataURL('image/png'),
          'PNG',
          0,
          0,
          A4_WIDTH_MM,
          Math.min(A4_HEIGHT_MM, sliceHeightMm),
          undefined,
          'FAST'
        );

        offsetY += sliceHeightPx;
        pageIndex += 1;
      }
    }

    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 5000);
  } finally {
    host.remove();
  }
}
