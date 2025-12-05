
import { chromium } from "playwright-extra";
import { OfferInfo } from './types/offer.type';
import { blacklist, meatKeywords } from "./data/keywords";
import { autoScroll } from "./helper/autoScroll";
import { filterOffersByKeywords } from "./helper/offerFilter"
import { vegetablesKeywords } from "./data/keywords";
import { supplementsKeywords } from "./data/keywords";
import { drinkKeywords } from "./data/keywords";    

export async function getPennyOffers() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        const selector = `.tile-list`

        await page.goto("https://www.penny.de/angebote", { waitUntil: "networkidle" });

        await page.evaluate(() => {
            localStorage.setItem("marketData", JSON.stringify({ "marketId": "621161", "wwIdent": "562085", "wawi": "37302169", "sellingRegion": "15A-11-57", "nextWeekSellingRegion": "", "marketName": "Penny Bornstedt", "streetWithHouseNumber": "Alexander-Klein-Str. 4", "slug": "penny-bornstedt-alexander-klein-str-4", "zipCode": "14469", "city": "Potsdam", "citySlug": "potsdam", "state": "Brandenburg", "stateSlug": "brandenburg", "renovationFrom": "30.04.2022", "reopeningFrom": "10.05.2022", "latitude": "52.41421", "longitude": "13.03748", "selfCheckoutActive": false, "selfCheckoutValidFrom": "", "selfCheckoutValidTo": "", "mobileSelfCheckoutActive": false, "mobileSelfCheckoutValidFrom": "", "mobileSelfCheckoutValidTo": "", "handoutRegion": "37", "nonFood": "NF", "bringooDeliveryService": false, "closedMonday": false, "opensAtMonday": "07:00", "closesAtMonday": "22:00", "closedTuesday": false, "opensAtTuesday": "07:00", "closesAtTuesday": "22:00", "closedWednesday": false, "opensAtWednesday": "07:00", "closesAtWednesday": "22:00", "closedThursday": false, "opensAtThursday": "07:00", "closesAtThursday": "22:00", "closedFriday": false, "opensAtFriday": "07:00", "closesAtFriday": "22:00", "closedSaturday": false, "opensAtSaturday": "07:00", "closesAtSaturday": "22:00", "closedSunday": true, "opensAtSunday": "", "closesAtSunday": "", "openingSentence": "Mo-Sa: 07:00 bis 22:00 Uhr", "hallInfoKey": "YW", "hallInfoName": "PENNY MaHa n. gedreht", "hallInfoValidFrom": "10.05.2022", "temporarilyClosedFrom": "01.05.2022", "temporarilyClosedUntil": "09.05.2022", "image": "https://cdn.penny.de/dam/jcr:75008afa-2972-414b-859d-07ad88203b15/Page-Intro-L_Desktop_Penny_37302169.jpg", "mobileImage": "https://cdn.penny.de/dam/jcr:f94fa27b-cfaa-491d-8cbd-15c082eb864f/Page-Intro-M_Mobile_Penny_37302169.jpg", "imageAlt": "Sie sehen den Eingang vom Penny Markt in Potsdam Alexander-Klein-Str. 4", "imageTitle": null, "flippingBookURL": "https://penny-publish.blaetterkatalog.de/frontend/getcatalog.do?catalogId=1173083", "nextWeekFlippingBookURL": null })) // <- deine Filial-ID
        });

        await page.reload({ waitUntil: "networkidle" });

        await autoScroll(page)

        await page.waitForSelector(selector)

        // Alle ArtikelTiles auslesen 
        const offers: OfferInfo[] = await page.$$eval('.tile-list__item', nodes =>
            nodes.map(n => {
                const title = n.querySelector(".h4.offer-tile__headline")?.textContent?.trim() || '';
                const amount = n.querySelector(".offer-tile__unit-price")?.textContent?.trim().split("(")[0] || '';
                const price = Number(n.querySelector(".bubble__price-value")?.textContent?.trim());
                const priceOld = n.querySelector(".bubble__small-value")?.textContent?.trim() || '';
                const priceBase = Number(n.querySelector(".offer-tile__unit-price")?.textContent?.trim().includes("=") ?
                    n.querySelector(".offer-tile__unit-price")?.textContent?.trim().split("=")[1].replace(")", "") : price);
                const percentSaving = n.querySelector(".offer-tile__badges.badge__container")?.textContent?.trim() || '';
                return { title, amount, price, priceOld, percentSaving, priceBase, discounter: "Penny" };
            })
        );
        return offers
    } catch (err) {
        console.error('Fehler beim Abrufen der Angebote:', err);
    } finally {
        await browser.close();
    }

}

/*
(async () => {
    let offers = await getPennyOffers()
    const offer = {
            "meatOffer":  filterOffersByKeywords(offers ?? [] , meatKeywords, blacklist)
            .sort((a, b) => a.priceBase - b.priceBase),
            "vegetablesOffer":  filterOffersByKeywords(offers ?? [] , vegetablesKeywords, blacklist)
            .sort((a, b) => a.priceBase - b.priceBase),
            "supplementsOffer":  filterOffersByKeywords(offers ?? [] , supplementsKeywords, blacklist)
            .sort((a, b) => a.priceBase - b.priceBase),
            "drinkOffer":  filterOffersByKeywords(offers ?? [] , drinkKeywords, blacklist)
            .sort((a, b) => a.priceBase - b.priceBase)
        }
    console.log("penny offers loaded: ", offer)
})()
*/
