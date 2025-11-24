import { chromium } from 'playwright';
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"
import { OfferInfo } from "./types/offer.type";
import { filterOffersByKeywords } from "./helper/offerFilter";
import { blacklist, meatKeywords } from "./data/keywords";

type TextItem = {
    text: string;
    x: number;
    y: number;
};

/**
 * Hauptfunktion: PDF per URL laden & vollständig analysieren
 */
export async function extractOffersFromUrl(pdfUrl: string): Promise<OfferInfo[]> {
    // -----------------------------------------------------
    // 1) PDF laden
    // -----------------------------------------------------
    const response = await fetch(pdfUrl);
    if (!response.ok) throw new Error("PDF konnte nicht geladen werden");

    const uint8 = new Uint8Array(await response.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;

    const offers: OfferInfo[] = [];

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
            const priceOld = oldMatch ? oldMatch[1] : "";

            // --- Prozent ---
            const percentMatch = blockText.match(/(\d{1,2}\s?%)/);
            const percentSaving = percentMatch ? percentMatch[1] : "";

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

async function getActualPdfUrl() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('https://www.lidl.de/c/online-prospekte/s10005610', { waitUntil: 'domcontentloaded' });

        // accept user data handling
        await page.click("#onetrust-accept-btn-handler")

        // close overlay 'Filiale wählen' 
        await page.click(".overlay__close-button")

        await page.click("[data-track-name='Aktionsprospekt']")

        let apiUrl = "";
        page.on("requestfinished", req => {
            if (req.url().includes("/v4/flyer")) {
                apiUrl = req.url();
            }
        });

        // kurz warten, damit alle Netzwerkaufrufe durch sind
        await page.waitForTimeout(1500);

        // 3. Wenn gefunden → direkt aufrufen
        if (apiUrl) {
            apiUrl += "&region_id=22&region_code=22"
            console.log("API gefunden:", apiUrl);

            const response = await page.request.get(apiUrl);
            const data = await response.json();
            const pdfUrl: string = data.flyer.pdfUrl
            console.log("PDF-URL:", pdfUrl);
            return pdfUrl;
        } else {
            console.log("Kein API-Endpunkt gefunden!");
        }

    } catch (error) {
        console.error('Fehler beim Abrufen des PDF-Prospekts:', error);
    } finally {
        await browser.close();
    }
}

export async function getLidlOffers() {
    try {
        const url = await getActualPdfUrl()
        if (url) {
            const data = await extractOffersFromUrl(url);
            // console.log(JSON.stringify(filterOffersByKeywords(data, meatKeywords, blacklist), null, 2));
            return data;
        }
        throw new Error("Could not extract pdf url.")
    } catch (error) {
        console.error("Could not extract Lidl offer. Reason: ", error)
    }
}

/* -----------------------------------------------------
   Beispielaufruf
------------------------------------------------------ */
/*
(async () => {
   await getLidlOffers()
})();
*/
