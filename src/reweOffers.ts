import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { OfferInfo } from './types/offer.type';
import { autoScroll } from "./helper/autoScroll";
import { blacklist, meatKeywords, vegetablesKeywords, supplementsKeywords, drinkKeywords } from "./data/keywords";
import { filterOffersByKeywords } from "./helper/offerFilter";

chromium.use(StealthPlugin());

export async function getReweOffers() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        const selector = `.sos-offer`

        await page.goto("https://www.rewe.de/angebote/potsdam-golm/4040421/rewe-markt-in-der-feldmark-3a/?icid=marktseiten_rewe-de%3Amarktseite-4040421_int_angebote_rewe-de%3Aangebote_nn_nn_nn_nn", { waitUntil: "domcontentloaded" });

        await page.waitForSelector(selector, { state: "attached", timeout: 60000 })

        await autoScroll(page)

        // Alle ArtikelTiles auslesen 
        const offers: OfferInfo[] = await page.$$eval(selector, nodes =>
            nodes.map(n => {
                const informationArray = Array.from(n.querySelectorAll(".cor-offer-information__additional"))
                const title = n.querySelector(".cor-offer-information__title")?.textContent?.trim() || '';
                const amount = informationArray.filter((item) => item.textContent.includes("je"))[0]?.textContent?.trim() || '';
                const price = Number(n.querySelector(".cor-offer-price__tag-price")?.textContent?.split(" ")[0].trim().replace(",", "."))
                const priceOld = ""
                const informationArrayPriceBase = informationArray.filter((item) => item.textContent.includes("="))
                const priceBase = Number(informationArrayPriceBase.length == 1 ?
                    informationArrayPriceBase[0].textContent?.split("=")[1].trim().replace(")", "").replace(",", ".") : amount.includes("100") ? price*100 : price);
                const percentSaving = ""
                return { title, amount, price, priceOld, percentSaving, priceBase, discounter: "Rewe" };
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
    let offers = await getReweOffers()
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
    console.log("rewe offers loaded: ", offer)
})()
*/