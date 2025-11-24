import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { OfferInfo } from './types/offer.type';
import { autoScroll } from "./helper/autoScroll";
import { blacklist, meatKeywords } from "./data/keywords";

chromium.use(StealthPlugin());

export async function getReweOffers() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        const selector = `#sos-category__grid-frische-und-convenience`

        await page.goto("https://www.rewe.de/angebote/potsdam-golm/4040421/rewe-markt-in-der-feldmark-3a/?icid=marktseiten_rewe-de%3Amarktseite-4040421_int_angebote_rewe-de%3Aangebote_nn_nn_nn_nn#frische-und-convenience-current-week", { waitUntil: "domcontentloaded" });

        await page.waitForSelector(selector, { state: "attached", timeout: 30000 })

        await autoScroll(page)

        // Alle ArtikelTiles auslesen 
        const offers: OfferInfo[] = await page.$$eval('[data-category="frische-und-convenience"]', nodes =>
            nodes.map(n => {
                const informationArray = Array.from(n.querySelectorAll(".cor-offer-information__additional"))
                const title = informationArray.map(el => el.textContent?.trim()).join("") + " " + n.querySelector(".cor-offer-information__title")?.textContent?.trim() || '';
                const amount = ""
                const price = Number(n.querySelector(".cor-offer-price__tag-price")?.textContent?.split(" ")[0].trim().replace(",", "."))
                const priceOld = ""
                const informationArrayPriceBase = informationArray.filter((item) => item.textContent.includes("="))
                const priceBase = Number(informationArrayPriceBase.length == 1 ?
                    informationArrayPriceBase[0].textContent?.split("=")[1].trim().replace(")", "").replace(",", ".") : title.includes("100 g") ? price*100 : price);
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
    console.log("Rewe offers loaded: ", filterOffersByKeywords(offers ?? [] , meatKeywords, blacklist)
        .sort((a, b) => a.priceBase - b.priceBase))
})()
*/
