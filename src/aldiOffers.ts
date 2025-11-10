import { chromium } from 'playwright';
import { Page } from 'playwright';
import { Offer } from './types/offer.type';
import { blacklist, meatKeywords } from './helper/meatKeywords';
import { autoScroll } from './helper/autoScroll';
import { filterOffersByKeywords } from "./helper/offerFilter";

export async function getAldiOffers() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('https://www.aldi-nord.de/angebote.html', { waitUntil: 'networkidle' });

        // Warten, bis die Angebotskacheln geladen sind
        await page.waitForSelector(".tiles-grid")

        await autoScroll(page)

        // Alle ArtikelTiles auslesen
        const offers : Offer[] = await page.$$eval('[data-t-name="ArticleTile"]', nodes =>
            nodes.map(n => {
                const title = n.querySelector('.mod-article-tile__title')?.textContent?.trim() || '';
                const amount = n.querySelector('.price__unit')?.textContent?.trim() || '';
                let priceBase = Number(n.querySelector('.price__base')?.textContent?.trim().split("=")[1]); 
                const price = Number(n.querySelector('.price__wrapper')?.textContent?.trim().split("\n")[0]);
                const priceOld =  n.querySelector('.price__previous')?.textContent?.trim(); 
                const percentSaving = n.querySelector('.price__previous-percentage')?.textContent?.trim();
                if (amount == "kg-Preis") priceBase = price
                return { title, amount,price,priceOld, percentSaving, priceBase, discounter : "Aldi" };
            })
        );
        return offers
    } catch (err) {
        console.error('Fehler beim Abrufen der Angebote:', err);
    } finally {
        await browser.close();
    }
}
