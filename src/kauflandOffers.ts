import { chromium } from "playwright-extra";
import { OfferInfo } from './types/offer.type';
import { blacklist, meatKeywords } from "./data/keywords";

export async function getKauflandOffers(url: string) {
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
    await page.reload({ waitUntil: "networkidle" });

    // Cookies akzeptieren
    await page.click("#onetrust-accept-btn-handler")

    try {
        const selector = `.k-product-section__grid`

        await page.goto(url, { waitUntil: "domcontentloaded" });

        await page.waitForSelector(selector);

        // Alle ArtikelTiles auslesen 
        const offers: OfferInfo[] = await page.$$eval(".k-grid__item", nodes =>
            nodes.map(n => {
                const title = n.querySelector("div.k-product-tile__title")?.textContent?.trim() || '';
                const subtitle = n.querySelector("div.k-product-tile__subtitle")?.textContent?.trim() || '';
                const amount = n.querySelector("div.k-product-tile__unit-price")?.textContent?.trim() || '';
                const price = Number(n.querySelector("div.k-price-tag__price")?.textContent?.trim().replace("*", "") || '');
                const priceOld = n.querySelector("k-price-tag__old-price")?.textContent?.trim() || '';
                const priceBaseStr = n.querySelector("div.k-product-tile__base-price")?.textContent?.trim()
                const priceBase = priceBaseStr?.includes("=") ? Number(n.querySelector("div.k-product-tile__base-price")?.textContent?.split("=")[1].trim().replace(")", "")) : price
                const percentSaving = n.querySelector("div.k-price-tag__discount")?.textContent?.trim() || '';
                return { title: subtitle != '' ? subtitle : title, amount, price, priceOld, percentSaving, priceBase, discounter: "Kaufland Zeppelinstraße" };
            })
        );
        return offers
    } catch (err) {
        console.error('Fehler beim Abrufen der Angebote:', err);
    } finally {
   //    await browser.close();
    }
}

/*
(async () => {
    let offers = await getKauflandOffers("https://filiale.kaufland.de/angebote/uebersicht.html?kloffer-category=02_Obst__Gemuese__Pflanzen") 
    offers?.push(...await getKauflandOffers("https://filiale.kaufland.de/angebote/uebersicht.html?kloffer-category=135_Foodknueller") ?? [])
    offers?.push(...await getKauflandOffers("https://filiale.kaufland.de/angebote/uebersicht.html?kloffer-category=02_Obst__Gemuese__Pflanzen") ?? [])
    offers?.push(...await getKauflandOffers("https://filiale.kaufland.de/angebote/uebersicht.html?kloffer-category=01_Fleisch__Gefluegel__Wurst") ?? [])
    offers?.push(...await getKauflandOffers("https://filiale.kaufland.de/angebote/uebersicht.html?kloffer-category=01a_Frischer_Fisch") ?? [])
    console.log("Kaufland offers loaded: ", filterOffersByKeywords(offers ?? [] , meatKeywords, blacklist)
        .sort((a, b) => a.priceBase - b.priceBase))
})()*/
