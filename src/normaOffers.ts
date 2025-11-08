
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Offer } from './types/offer.type';
import { blacklist, meatKeywords } from "./helper/meatKeywords";
import { filterOffersByKeywords } from "./helper/offerFilter";

chromium.use(StealthPlugin());

export async function getNormaOffers() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    // Cookie für eine bestimmte Netto-Filiale (z. B. 2043 = Beispiel-ID)
    await context.addCookies([
        {
            name: "NORMA_clid",
            value: "2202", // deine gewünschte Filial-ID
            domain: "www.norma-online.de",
            path: "/",
        },
         {
            name: "NORMA_banner",
            value: "1", // deine gewünschte Filial-ID
            domain: "www.norma-online.de",
            path: "/",
        },
         {
            name: "NORMA_cache",
            value: "MD", // deine gewünschte Filial-ID
            domain: "www.norma-online.de",
            path: "/",
        },
         {
            name: "NORMA_tracking",
            value: "Slider,2025_kw46_mo_coupons", // deine gewünschte Filial-ID
            domain: "www.norma-online.de",
            path: "/",
        },
    ]);

    const page = await context.newPage();

    try {

        await page.goto("https://www.norma-online.de", { waitUntil: "networkidle" });

        // accept cookies and close popup
        await page.click('[data-testid="uc-accept-all-button"]')
        await page.click("#popupCloseX")

        // navigate to offers page from monday
        await page.waitForSelector(".subnav.subnav-1")
        await page.click('#js-getheight > li.l-42.lvl-1.active > ul > li:nth-child(3)')
    
        // switch to /dauerhaft-beste-preis-leistung
        await page.click(".selectize-input.items.not-full.has-options")
        await page.click('div[data-value="/de/angebote/ab-montag,-10.11.25/dauerhaft-beste-preis-leistung-t-341394/"]')
        
        await page.waitForSelector("#dauerhaft-beste-preis-leistung-t-341394", { state: "attached", timeout: 30000 })

         // Alle ArtikelTiles auslesen
        const offers: Offer[] = await page.$$eval('.b463.produktBoxContainer', nodes =>
            nodes.map(n => {
                const title = n.querySelector(".produktBox-txt-headline")?.textContent?.trim() || '';
                const amount = n.querySelector(".produktBox-txt-inh")?.textContent?.trim() || '';
                const price =  Number(n.querySelector(".produktBox-cont-wrapper-price")?.textContent?.trim().replace(",",".").replace("*",""))
                const priceOld = n.querySelector(".produktBox-cont-wrapper-uvp")?.textContent?.trim() || '';
                const priceBase = Number(n.querySelector(".produktBox-txt-price")?.textContent?.trim().split("=")[1].replace(")", "").replace(",", "."))
                const percentSaving = n.querySelector(".produktBox-cont-wrapper-billiger")?.textContent?.trim() || ''; 
                return { title, amount, price, priceOld, percentSaving, priceBase, discounter: "Norma" };
            })
        );
        return filterOffersByKeywords(offers, meatKeywords, blacklist);
    } catch (err) {
        console.error('Fehler beim Abrufen der Angebote:', err);
    } finally {
        await browser.close();
    }

}
