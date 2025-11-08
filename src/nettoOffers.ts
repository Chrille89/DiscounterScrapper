import { chromium } from "playwright-extra";
import { Offer } from './types/offer.type';
import { meatKeywords } from "./helper/meatKeywords";

export async function getNettoOffers(url: string): Promise<Offer[] | undefined> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        let offers = []
        let index = 0
        while (true) {
            let selector = `[aria-label="product-${index}"]`

            try {
                await page.waitForSelector(selector, { state: "attached", timeout: 5000 })
                const offer: Offer = await page.$eval(selector, (n) => {
                    const title = n.querySelector("h4")?.textContent?.trim().replace("\n", " ") || '';
                    const price = Number(n.querySelector('h3')?.textContent?.trim() || '');
                    let amount = n.querySelector('p')?.textContent?.trim().replace("\n", " ") || '';
                    let priceBase = price
                    if (!amount.includes("=")) {
                        amount = "1 Stück"
                    } else {
                        priceBase = Number(amount.split("=")[1])
                        amount = amount.split("1")[0].trim()
                    }
                    return { title, amount, price, priceOld: undefined, percentSaving: undefined, priceBase, discounter: "Netto" };
                })

                if (meatKeywords.some(word => offer.title.toLowerCase().includes(word))) offers.push(offer)
                index++;
            } catch (err) {
                break;
            }
        }
        return offers;
    } catch (err) {
        console.error('Fehler beim Abrufen der Angebote:', err);
    } finally {
        await browser.close();
    }
}
