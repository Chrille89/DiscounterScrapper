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

                        const price =
                            tile.querySelector('[data-testid$="-tag-current-price-amount"]')
                                ?.textContent?.trim() || "";

                        const priceOld =
                            tile.querySelector('[data-testid$="-tag-cross-price-label"]')
                                ?.textContent?.trim() || "";
                            
                        const percentSaving =       
                            tile.querySelector('[data-testid$="-tag-promo-label"]')
                                ?.textContent?.trim() || "";4
                        
                        const priceBase =
                            tile.querySelector('[data-testid$="-tag-base-price"]')
                                ?.textContent?.trim() || "";
                               
                        result.push({
                            title,
                            amount,
                            price: Number(price.replace(/[^\d,.,-]/g, "").replace("-", "")),
                            priceOld,
                            percentSaving,
                            priceBase: Number(priceBase.replace(/[^\d,.,-]/g, "").replace("-", "")),
                            discounter: "Aldi"
                        });
                    });
                });

                return result; // <-- das geht zurück nach Node.js
            }
        );
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

