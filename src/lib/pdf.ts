// pdfjs et mammoth sont volumineux (~1 Mo). On les charge **dynamiquement**
// uniquement au moment de l'extraction, pour ne pas plomber le bundle initial
// de la page Upload.

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const [pdfjs, workerUrlMod] = await Promise.all([
        import("pdfjs-dist"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
      ]);
      pdfjs.GlobalWorkerOptions.workerSrc = (workerUrlMod as { default: string }).default;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await loadPdfjs();
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

/**
 * Rend les premières pages d'un PDF en images JPEG (base64, sans préfixe data:).
 * Sert aux PDF scannés, qui n'ont pas de couche texte : chaque image part
 * ensuite à l'OCR. La largeur est plafonnée pour garder des envois légers.
 */
export async function renderPdfPagesToJpeg(
  file: File,
  maxPages = 6,
  maxWidth = 1400,
): Promise<{ images: string[]; totalPages: number }> {
  const pdfjs = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf, isEvalSupported: false, disableFontFace: true }).promise;
  const count = Math.min(pdf.numPages, maxPages);
  const images: string[] = [];
  for (let i = 1; i <= count; i++) {
    try {
      const page = await pdf.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2, maxWidth / base.width);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
      images.push(canvas.toDataURL("image/jpeg", 0.8).split(",")[1]);
      canvas.width = 0;
      canvas.height = 0;
    } catch (err) {
      console.warn(`[pdf] rendu page ${i} impossible`, err);
    }
  }
  return { images, totalPages: pdf.numPages };
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
  const { default: mammoth } = await import("mammoth");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return (result.value ?? "").trim();
}

export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function isDocx(file: File) {
  return file.type === DOCX_MIME || /\.docx$/i.test(file.name);
}