import { chromium } from 'playwright';
import { Page } from 'playwright';
import { OfferInfo } from './types/offer.type';
import { blacklist, meatKeywords } from './data/keywords';
import { autoScroll } from './helper/autoScroll';
import { filterOffersByKeywords } from './helper/offerFilter'
import { vegetablesKeywords } from './data/keywords';
import { supplementsKeywords } from './data/keywords';
import { drinkKeywords } from './data/keywords';

export async function getAldiOffers() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await page.goto('https://www.aldi-nord.de/angebote.html', { waitUntil: 'domcontentloaded' });

        await page.click('button[data-testid="uc-accept-all-button"]'); // Cookie-Banner akzeptieren

        // Warten, bis die Angebotskacheln geladen sind
        await page.waitForSelector(".tile-grid");
        const offers: OfferInfo[] = await page.$$eval(
            'div[data-testid="product-tile-grid"]',
            grids => {
                const result: OfferInfo[] = []; // <-- Array im Browser-Kontext

                grids.forEach(grid => {
                    const tiles = grid.querySelectorAll(
                        '[data-testid*="product-tile-grid-product-tile-"]'
                    );

                    tiles.forEach(tile => {
                        const title =
                            tile.querySelector('[data-testid$="-product-name"]')
                                ?.textContent?.trim() || "";

                        const amount =
                            tile.querySelector('[data-testid$="-tag-sales-unit"]')
                                ?.textContent?.trim() || "";

                        result.push({
                            title,
                            amount,
                            price: 0,
                            priceOld: "",
                            percentSaving: "",
                            priceBase: 0,
                            discounter: "Aldi"
                        });
                    });
                });

                return result; // <-- das geht zurück nach Node.js
            }
        );

        /*

console.log("title: ", title)
        const amount =
          n.querySelector('[data-testid$="-tag-sales-unit"]')
            ?.textContent?.trim() || "";
console.log("amount: ", amount)
                const priceBaseStr = n.querySelector('.price__base')?.textContent?.trim().split("=")[1].replace(")","").replace(",",".").trim(); 
                let priceBase = priceBaseStr?.includes("/") ? Number(priceBaseStr.split("/")[1].substring(0,4)) : Number(priceBaseStr?.substring(0,4))
                const price = Number(n.querySelector('.price__wrapper')?.textContent?.trim().split("\n")[0]);
                const priceOld =  n.querySelector('.price__previous')?.textContent?.trim() ?? ""; 
                const percentSaving = n.querySelector('.price__previous-percentage')?.textContent?.trim() ?? "";
                if (amount == "kg-Preis") priceBase = price
                return { title, amount,price,priceOld, percentSaving, priceBase, discounter : "Aldi" };
            })
        }

        );*/
        console.log("Aldi offers loaded: ", offers)
        return offers
    } catch (err) {
        console.error('Fehler beim Abrufen der Angebote:', err);
    } finally {
        await browser.close();
    }
}


(async () => {
    let offers = await getAldiOffers()
    const offer = {
        "meatOffer": filterOffersByKeywords(offers ?? [], meatKeywords, blacklist)
            .sort((a, b) => a.priceBase - b.priceBase).slice(0, 5),
        "vegetablesOffer": filterOffersByKeywords(offers ?? [], vegetablesKeywords, blacklist)
            .sort((a, b) => a.priceBase - b.priceBase).slice(0, 5),
        "supplementsOffer": filterOffersByKeywords(offers ?? [], supplementsKeywords, blacklist)
            .sort((a, b) => a.priceBase - b.priceBase).slice(0, 5),
        "drinkOffer": filterOffersByKeywords(offers ?? [], drinkKeywords, blacklist)
            .sort((a, b) => a.priceBase - b.priceBase).slice(0, 5)
    }
    console.log("Aldi offers loaded: ", offer)
})()

