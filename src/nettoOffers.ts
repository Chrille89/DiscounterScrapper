import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Page } from "playwright";
import { Offer } from './types/offer.type';

chromium.use(StealthPlugin());
const keywords = [
    "huhn",
    "rind",
    "hähnchen",
    "brust",
    "filet",
    "schnitzel",
    "ente",
    "gans",
    "schulter",
    "haxe",
    "eisbein",
    "bauch",
    "hüft",
    "nacken",
    "kotelett",
    "kasseler",
    "rücken",
    "fisch",
    "schwein",
    "hack"
];

export async function getNettoOffers() {
    let offers = [];
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    // Cookie für eine bestimmte Netto-Filiale (z. B. 2043 = Beispiel-ID)
    await context.addCookies([
        {
            name: "netto_user_stores_id",
            value: "5842", // deine gewünschte Filial-ID
            domain: "www.netto-online.de",
            path: "/",
        },
    ]);

    const page = await context.newPage();
    try {
        await page.goto('https://www.netto-online.de/filialangebote', { waitUntil: "domcontentloaded" });

        let index = 1;
        while (true) {
            try {
                offers.push(...await getProductOffersByPage(page, index))
                index++
            } catch (err) {
                break;
            }

        }

        // Nach dem Einlesen der Angebote
        let filteredOffers = offers.filter(
            (offer, index, self) =>
                (index === self.findIndex((o) => o.title === offer.title)) &&
                (keywords.some(word => offer.title.toLowerCase().includes(word))
                )
        );
        return filteredOffers
    } catch (err) {
        console.error('Fehler beim Abrufen der Angebote:', err);
    } finally {
        await browser.close();
    }
}

async function getProductOffersByPage(page: Page, pageNumber: number = 0) {
    const selector = `.product-list.clearfix.js-store-products-page-${pageNumber}`
    try {
        // Warten, bis die Angebotskacheln geladen sind
        await page.waitForSelector(selector, { state: "attached", timeout: 5000 })

        // Alle ArtikelTiles auslesen
        const offers: Offer[] = await page.$eval(selector,
            (ul) => {
                // ul ist hier das erste Element, das dem Selector entspricht
                return Array.from(ul.querySelectorAll("div")).map((div) => {
                    let offer: Offer = {
                        title: div.querySelector(".product__title")?.textContent?.trim() ?? "",
                        amount: div.querySelector(".product-property.product-property__bundle-text")?.textContent?.trim() ?? "",
                        price: Number(div.querySelector(".product__current-price.tc-product-price")?.textContent?.trim().replace(/[^\d,.,-]/g, "").replace("-", "")),
                        priceOld: div.querySelector(".product__old-price")?.textContent?.trim() ?? "",
                        percentSaving: div.querySelector(".product__percent-saving__text")?.textContent?.trim(),
                        priceBase: Number(div.querySelector(".product-property.product-property__base-price")?.textContent?.trim().split("/")[0]),
                        discounter: "Netto Marken-Discount"
                    }
                    if (offer.amount == "1 kg" || offer.amount == "pro kg") offer.priceBase = offer.price
                    return offer;

                }
                )
            }
        );
        return offers
    } catch (err) {
        throw err
    }
}