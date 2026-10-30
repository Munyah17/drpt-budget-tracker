/**
 * Generic printable document — contracts, HR forms, letters.
 * The caller builds a PrintDoc, stores it in sessionStorage, then opens
 * /print/doc which renders it as an A4 sheet for print/PDF.
 */

export const PRINTDOC_KEY = "drpt-print-doc";

export interface PrintDocSection {
  heading?: string;
  body?: string; // paragraphs split on \n\n
  fields?: { label: string; value: string }[];
}

export interface PrintDoc {
  docType: string; // e.g. "CONTRACT OF EMPLOYMENT"
  company: string;
  companyAddress?: string;
  ref?: string;
  date?: string;
  subject?: string; // "RE: …" line
  sections: PrintDocSection[];
  signatures: { label: string; name?: string }[];
  footerNote?: string;
}

export function openPrintDoc(doc: PrintDoc) {
  sessionStorage.setItem(PRINTDOC_KEY, JSON.stringify(doc));
  window.open("/print/doc", "_blank");
}
