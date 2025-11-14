import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Offer } from './types/offer.type';
import { autoScroll } from "./helper/autoScroll";
import { blacklist, meatKeywords } from "./helper/meatKeywords";
import { filterOffersByKeywords } from "./helper/offerFilter";
import { off } from "process";

//chromium.use(StealthPlugin());

export async function getKauflandOffers() {
    console.log("Kaufland Scraper started")
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.route("**/user-service/*", route => {
  route.abort(); // blockiert Standort-APIs
});

    // 1️⃣ Zuerst zur Domain navigieren, sonst existiert sessionStorage nicht
    await page.goto("https://filiale.kaufland.de", { waitUntil: "domcontentloaded" });

     await page.evaluate(() => {
        sessionStorage.setItem(
            "storeData",
            JSON.stringify({ "name": "DE6960", "lat": "52.3892733", "lng": "13.0299452", "storeAddressCompanyName": "Kaufland Potsdam-West", "storeAddressPhone1": "0331/95130830", "storeAddressPostalCode": "14471", "storeAddressStreetName": "Zeppelinstraße 132", "storeAddressTown": "Potsdam", "openingDate": "2011-08-25T00:00:00.000Z", "weekdayOpeningDay": ["Monday|07:00|22:00", "Tuesday|07:00|22:00", "Wednesday|07:00|22:00", "Thursday|07:00|22:00", "Friday|07:00|22:00", "Saturday|07:00|22:00", "Sunday|00:00|00:00"], "facelift": { "from": "2017-07-03", "to": "2017-07-03" }, "friendlyUrl": "potsdam-west-6960", "earlyOpeningDate": "", "expire": Date.now() + 1000 * 60 * 60 * 4 })
        );
    });

    // 3️⃣ Seite neu laden, damit Änderungen greifen
    console.log("Reloading page to set store location...")
    await page.reload({ waitUntil: "networkidle" });

    // Cookies akzeptieren
    await page.click("#onetrust-accept-btn-handler")

    try {
        const selector = `.k-product-section__grid`

        await page.goto("https://filiale.kaufland.de/angebote/uebersicht.html?kloffer-category=135_Foodknueller", { waitUntil: "domcontentloaded" });

        await page.waitForSelector(selector)

      //  await autoScroll(page)

        // Alle ArtikelTiles auslesen 
        const offers: Offer[] = await page.$$eval(".k-grid__item", nodes =>
            nodes.map(n => {
                const title =  n.querySelector("div.k-product-tile__subtitle")?.textContent?.trim() || '';
                const amount = n.querySelector("div.k-product-tile__unit-price")?.textContent?.trim() || '' ;
                const price = Number(n.querySelector("div.k-price-tag__price")?.textContent?.trim().replace("*","") || '' );
                const priceOld = n.querySelector("k-price-tag__old-price")?.textContent?.trim() || '' ;
                const priceBaseStr =  n.querySelector("div.k-product-tile__base-price")?.textContent?.trim()
                const priceBase = priceBaseStr?.includes("=") ? Number(n.querySelector("div.k-product-tile__base-price")?.textContent?.split("=")[1].trim().replace(")","")) : 0
                const percentSaving =  n.querySelector("div.k-price-tag__discount")?.textContent?.trim() || '' ; 
                return { title, amount, price, priceOld, percentSaving, priceBase, discounter: "Kaufland Postdam-West" };
            })
        );
        return offers
    } catch (err) {
        console.error('Fehler beim Abrufen der Angebote:', err);
    } finally {
        await browser.close();
    }
}

(async () => {
    const offers = await filterOffersByKeywords(await getKauflandOffers() ?? [] , meatKeywords, blacklist)
        .sort((a, b) => a.priceBase - b.priceBase)
    console.log("Offers: ", offers)
})()