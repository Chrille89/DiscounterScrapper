import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"
import { Offer } from "./types/offer.type";
import { filterOffersByKeywords } from "./helper/offerFilter";
import { blacklist, meatKeywords } from "./data/meatKeywords";

type TextItem = {
    text: string;
    x: number;
    y: number;
};

/**
 * Hauptfunktion: PDF per URL laden & vollständig analysieren
 */
export async function extractOffersFromUrl(pdfUrl: string): Promise<Offer[]> {
    // -----------------------------------------------------
    // 1) PDF laden
    // -----------------------------------------------------
    const response = await fetch(pdfUrl);
    if (!response.ok) throw new Error("PDF konnte nicht geladen werden");

    const uint8 = new Uint8Array(await response.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;

    const offers: Offer[] = [];

    // -----------------------------------------------------
    // 2) Jede Seite einzeln analysieren
    // -----------------------------------------------------
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();

        // Roh-Texte + Positionen extrahieren
        const items: TextItem[] = content.items.map((i: any) => ({
            text: (i.str || "").trim(),
            x: i.transform[4],
            y: i.transform[5]
        })).filter(i => i.text.length > 0);

        // Sortiert für bessere Gruppierung
        items.sort((a, b) => (b.y - a.y) || (a.x - b.x));

        // -----------------------------------------------------
        // 3) BLOCK-GROUPING: alle nahen Textobjekte in Blöcke packen
        // (wichtiger Fix für „Hack“ + „fleisch“, Bilderpreise etc.)
        // -----------------------------------------------------
        type Block = {
            xMin: number;
            xMax: number;
            yMin: number;
            yMax: number;
            items: string[];
        };

        const blocks: Block[] = [];
        const blockPadding = 90; // großzügig → Titel oberhalb & Preis in einem Block

        for (const it of items) {
            const { x, y, text } = it;

            let block = blocks.find(b =>
                x >= b.xMin - blockPadding &&
                x <= b.xMax + blockPadding &&
                y >= b.yMin - blockPadding &&
                y <= b.yMax + blockPadding
            );

            if (!block) {
                block = {
                    xMin: x,
                    xMax: x,
                    yMin: y,
                    yMax: y,
                    items: []
                };
                blocks.push(block);
            }

            block.items.push(text);
            block.xMin = Math.min(block.xMin, x);
            block.xMax = Math.max(block.xMax, x);
            block.yMin = Math.min(block.yMin, y);
            block.yMax = Math.max(block.yMax, y);
        }

        // -----------------------------------------------------
        // 4) Parsing der Blöcke → Offers
        // -----------------------------------------------------
        for (const b of blocks) {
            const blockText = b.items.join(" ").replace(/\s+/g, " ");

            // --- Hauptpreis ---
            const priceMatch = blockText.match(/\b\d{1,3}[.,]\d{2}\b/);
            if (!priceMatch) continue;
            const price = parseFloat(priceMatch[0].replace(",", "."));

            // --- alter Preis ---
            const oldMatch = blockText.match(/statt\s*(\d{1,3}[.,]\d{2})/i);
            const priceOld = oldMatch ? oldMatch[1] : undefined;

            // --- Prozent ---
            const percentMatch = blockText.match(/(\d{1,2}\s?%)/);
            const percentSaving = percentMatch ? percentMatch[1] : undefined;

            // --- Menge ---
            const amountMatch = blockText.match(/\b\d+(\.\d+)?\s*(g|kg|ml|l)\b/i);
            const amount = amountMatch ? amountMatch[0] : "";

            // --- Grundpreis aus Text ---
            const baseMatch = blockText.match(/(\d{1,3}[.,]\d{2})\s*€?\s*\/\s*(kg|l|g|ml)/i);

            let priceBase = 0;

            if (baseMatch) {
                priceBase = parseFloat(baseMatch[1].replace(",", "."));
            } else if (amountMatch) {
                const quantity = parseFloat(amountMatch[0]);
                const unit = amountMatch[2].toLowerCase();

                if (unit === "kg") {
                    priceBase = price;
                } else if (unit === "g") {
                    priceBase = price / (quantity / 1000);
                } else if (unit === "l") {
                    priceBase = price;
                } else if (unit === "ml") {
                    priceBase = price / (quantity / 1000);
                }
            }

            // --- Titel extrahieren ---
            let title = blockText
                .replace(priceMatch[0], "")
                .replace(priceOld ?? "", "")
                .replace(percentSaving ?? "", "")
                .replace(amount, "")
                .replace(/\d{1,3}[.,]\d{2}\s*€?\s*\/\s*(kg|l|g|ml)/i, "")
                .replace(/\s+/g, " ")
                .trim();

            // Häufige Störteile entfernen
            title = title
                .replace(/je\s*kg/i, "")
                .replace(/je\s*100\s*g/i, "")
                .replace(/^€/, "") // falls komische PDF-Reste
                .trim();

            // Leere Titel ignorieren
            if (!title || title.length < 2) continue;

            offers.push({
                title,
                amount,
                price,
                priceOld,
                percentSaving,
                priceBase: Number(priceBase.toFixed(2)),
                discounter: "Lidl"
            });
        }
    }

    return offers;
}

/* -----------------------------------------------------
   Beispielaufruf
------------------------------------------------------ */

(async () => {
    const url =
        "https://object.storage.eu01.onstackit.cloud/leaflets/pdfs/019a8453-11b9-7396-837e-491dc8afb6d7/Aktionsprospekt-17-11-2025-22-11-2025-02.pdf";

    const data = await extractOffersFromUrl(url);
    console.log(JSON.stringify(filterOffersByKeywords(data,meatKeywords,blacklist), null, 2));
})();
