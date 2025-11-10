import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Offer } from './types/offer.type';
import { blacklist, meatKeywords } from "./helper/meatKeywords";
import { filterOffersByKeywords } from "./helper/offerFilter";

chromium.use(StealthPlugin());

export async function getEdekaOffers() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        const selector = `[data-testid="eui-Box-container"]`

        await page.goto("https://www.edeka.de/eh/minden-hannover/edeka-center-stern-center-stern-center-1-10/angebote.jsp", { waitUntil: "domcontentloaded" });

        await page.waitForSelector(selector, { state: "attached", timeout: 30000 })

        const offers: Offer[] = await page.$$eval('.css-1uiiw0z', nodes =>
            nodes.map(n => {
                const title = n.querySelector(".css-i72elb")?.textContent?.trim() || '';
                let splittedTextArray = n.querySelector(".css-1skykc0")?.textContent?.split(" ")
                let extractedAmount = splittedTextArray ? splittedTextArray[splittedTextArray.length - 1] : "";
                if (splittedTextArray && extractedAmount.includes("=")) {
                    extractedAmount = splittedTextArray[splittedTextArray.length - 2].replace(",", "")
                }
                const amount = extractedAmount.trim()
                const price = Number(n.querySelector(".css-111vupd")?.textContent?.trim())
                const priceOld = "";
                const percentSaving = "";
                let calculatedPriceBase = Number(n.querySelector(".css-1js26ts")?.textContent?.trim().split("=")[1].replace(",", "."))
                if (!calculatedPriceBase) {
                    if (amount == "100g") {
                        calculatedPriceBase = price * 10
                    } else {
                        calculatedPriceBase = price
                    }
                }
                const priceBase = calculatedPriceBase.toFixed(2) as unknown as number
                return { title, amount, price, priceOld, percentSaving, priceBase, discounter: "Edeka Stern-Center" };
            })
        );
        return offers
    } catch (err) {
        console.error('Fehler beim Abrufen der Angebote:', err);
    } finally {
        await browser.close();
    }
}

