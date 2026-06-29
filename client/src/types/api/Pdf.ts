// window.api.pdf.* — render a self-contained HTML document to a PDF file.
// Backed by export:htmlToPdf in main.js (printToPDF + save dialog).

export interface PdfExportResult {
  success: boolean;
  filePath?: string;
  canceled?: boolean;
  error?: string;
}

export interface PdfAPI {
  pdf: {
    fromHtml: (html: string, defaultFileName?: string) => Promise<PdfExportResult>;
  };
}
