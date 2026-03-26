import jsPDF from 'jspdf';

export interface ExportOptions {
  format: 'pdf' | 'mp4' | 'slides';
  branding?: {
    logo?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
    footer?: string;
  };
  quality?: 'low' | 'medium' | 'high' | 'ultra';
}

export async function exportRecap(
  jobId: string,
  title: string,
  content: string,
  options: ExportOptions
): Promise<Blob> {
  switch (options.format) {
    case 'pdf':
      return await generatePDF(title, content, options);
    case 'mp4':
      return await generateVideo(title, content, options);
    case 'slides':
      return await generateSlides(title, content, options);
    default:
      throw new Error('Unsupported export format');
  }
}

async function generatePDF(
  title: string,
  content: string,
  options: ExportOptions
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const primaryColor = options.branding?.colors?.primary || '#C4813D';
  const secondaryColor = options.branding?.colors?.secondary || '#8B5E3C';

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 196, g: 129, b: 61 };
  };

  const primary = hexToRgb(primaryColor);
  const secondary = hexToRgb(secondaryColor);

  doc.setFillColor(primary.r, primary.g, primary.b);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, 25, { maxWidth: contentWidth });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`DimensionDownload For Study | ${new Date().toLocaleDateString()}`, margin, 35);

  doc.setDrawColor(secondary.r, secondary.g, secondary.b);
  doc.setLineWidth(0.5);
  doc.line(margin, 48, pageWidth - margin, 48);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const paragraphs = content.split('\n').filter(line => line.trim());
  let yPos = 56;

  for (const paragraph of paragraphs) {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }

    const isHeading = paragraph.startsWith('#') || paragraph.startsWith('**');
    const cleanText = paragraph.replace(/^#+\s*/, '').replace(/\*\*/g, '');

    if (isHeading) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondary.r, secondary.g, secondary.b);
      yPos += 4;
    } else {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
    }

    const lines = doc.splitTextToSize(cleanText, contentWidth);
    for (const line of lines) {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin, yPos);
      yPos += isHeading ? 7 : 6;
    }

    yPos += 3;
  }

  const footerText = options.branding?.footer || 'DimensionDownload For Study';
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(footerText, margin, pageHeight - 10);
    doc.text(`${i} / ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  return doc.output('blob');
}

async function generateVideo(
  _title: string,
  _content: string,
  _options: ExportOptions
): Promise<Blob> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  throw new Error('Video export requires server-side processing. Use the video task system instead.');
}

async function generateSlides(
  title: string,
  content: string,
  _options: ExportOptions
): Promise<Blob> {
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
  .slide { page-break-after: always; padding: 60px; min-height: 600px; box-sizing: border-box; }
  .slide:last-child { page-break-after: auto; }
  .title-slide { background: linear-gradient(135deg, #C4813D, #8B5E3C); color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
  .title-slide h1 { font-size: 48px; margin-bottom: 20px; }
  .title-slide p { font-size: 18px; opacity: 0.8; }
  .content-slide h2 { color: #C4813D; font-size: 28px; border-bottom: 2px solid #E8D5B7; padding-bottom: 10px; }
  .content-slide p { font-size: 16px; line-height: 1.8; color: #333; }
</style></head><body>`;

  html += `<div class="slide title-slide"><h1>${title}</h1><p>DimensionDownload For Study | ${new Date().toLocaleDateString()}</p></div>`;

  for (let i = 0; i < paragraphs.length; i++) {
    html += `<div class="slide content-slide"><h2>Section ${i + 1}</h2><p>${paragraphs[i].replace(/\n/g, '<br>')}</p></div>`;
  }

  html += '</body></html>';

  return new Blob([html], { type: 'text/html' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
