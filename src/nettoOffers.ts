import { chromium } from "playwright-extra";
import { OfferInfo } from './types/offer.type';
import { blacklist, meatKeywords ,vegetablesKeywords,drinkKeywords, supplementsKeywords} from "./data/keywords";
import { filterOffersByKeywords } from "./helper/offerFilter";

export async function getNettoOffers(url: string): Promise<OfferInfo[] | undefined> {
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
                const offer: OfferInfo = await page.$eval(selector, (n) => {
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
                    return { title, amount, price, priceOld: "", percentSaving: "", priceBase, discounter: "Netto" };
                })
                offers.push(offer)
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

/*
(async () => {
    let offers = await getNettoOffers("https://netto.de/angebote/spar-stars/")
    offers?.push(...await getNettoOffers("https://netto.de/angebote/regionale-produkte/") ?? [])
    offers?.push(...await getNettoOffers("https://netto.de/angebote/hammer-donnerstag/") ?? [])
    offers?.push(...await getNettoOffers("https://netto.de/angebote/knaller-wochenende/") ?? [])
    const offer = {
        "meatOffer": filterOffersByKeywords(offers ?? [], meatKeywords, blacklist)
            .sort((a, b) => a.priceBase - b.priceBase),
        "vegetablesOffer": filterOffersByKeywords(offers ?? [], vegetablesKeywords, blacklist)
            .sort((a, b) => a.priceBase - b.priceBase),
        "supplementsOffer": filterOffersByKeywords(offers ?? [], supplementsKeywords, blacklist)
            .sort((a, b) => a.priceBase - b.priceBase),
        "drinkOffer": filterOffersByKeywords(offers ?? [], drinkKeywords, blacklist)
            .sort((a, b) => a.priceBase - b.priceBase)
    }
    console.log("netto markendiscount offers loaded: ", offer)
})()
*/
