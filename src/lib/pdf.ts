import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({
    data: buf,
    // Tolère les PDFs un peu cassés / avec structures complexes (onglets, signets, formulaires)
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((it: any) => (typeof it.str === "string" ? it.str : ""))
        .join(" ");
      if (pageText.trim()) text += pageText + "\n\n";
    } catch (err) {
      console.warn(`[pdf] page ${i} illisible`, err);
    }
  }
  return text.trim();
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      resolve(result.split(",")[1]);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** Extrait le texte brut d'un fichier .docx (Word ou Google Docs exporté). */
export async function extractDocxText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return (result.value ?? "").trim();
}

export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function isDocx(file: File) {
  return file.type === DOCX_MIME || /\.docx$/i.test(file.name);
}