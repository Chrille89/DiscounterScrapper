import { Offer } from "./types/offer.type"
import { getAldiOffers } from "./aldiOffers"
import { getNettoDiscountOffers } from "./nettoDiscountOffers"
import { getNettoOffers } from "./nettoOffers"
import { getPennyOffers } from "./pennyOffers";
import { getReweOffers } from "./reweOffers";
import { getNormaOffers } from "./normaOffers";
import { getEdekaOffers } from "./edekaOffers";
import { blacklist, meatKeywords, vegetablesKeywords, supplementsKeywords , drinkKeywords} from './data/keywords';
import { filterOffersByKeywords } from "./helper/offerFilter";
import { getKauflandOffers } from "./kauflandOffers";
import { getLidlOffers } from "./lidlOffers";

(async () => {
    console.time("Load offers");

    const backendUrl = "http://h2857701.stratoserver.net:3001/offer"
    // const backendUrl = "http://localhost:3001/offer"

    // ALDI
    console.log("Loading ALDI offers...")
    let offers = await getAldiOffers()

    // NETTO Marken Discount
    console.log("Loading Netto Marken-Discount offers...")
    offers?.push(...await getNettoDiscountOffers() ?? [])

    // NETTO
    console.log("Loading Netto offers...")
    offers?.push(...await getNettoOffers("https://netto.de/angebote/spar-stars/") ?? [])
    offers?.push(...await getNettoOffers("https://netto.de/angebote/regionale-produkte/") ?? [])
    offers?.push(...await getNettoOffers("https://netto.de/angebote/hammer-donnerstag/") ?? [])

    // PENNY
    console.log("Loading Penny offers...")
    offers?.push(...await getPennyOffers() ?? [])

    // Rewe
    console.log("Loading Rewe offers...")
    offers?.push(...await getReweOffers() ?? [])

    // Norma
    console.log("Loading Norma offers...")
    offers?.push(...await getNormaOffers() ?? [])

    // Edeka Brandenburger Str. 
    console.log("Loading Edeka offers...")
    offers?.push(...await getEdekaOffers() ?? [])

    // Kaufland Zeppelinstraße
    console.log("Loading Kaufland offers...");
    offers?.push(...await getKauflandOffers("https://filiale.kaufland.de/angebote/uebersicht.html?kloffer-category=0001_TopArticle") ?? [])
    offers?.push(...await getKauflandOffers("https://filiale.kaufland.de/angebote/uebersicht.html?kloffer-category=135_Foodknueller") ?? [])
    offers?.push(...await getKauflandOffers("https://filiale.kaufland.de/angebote/uebersicht.html?kloffer-category=02_Obst__Gemuese__Pflanzen") ?? [])
    offers?.push(...await getKauflandOffers("https://filiale.kaufland.de/angebote/uebersicht.html?kloffer-category=01_Fleisch__Gefluegel__Wurst") ?? [])
    offers?.push(...await getKauflandOffers("https://filiale.kaufland.de/angebote/uebersicht.html?kloffer-category=01a_Frischer_Fisch") ?? [])
    
    const offer : Offer = {
        "meatOffer":  filterOffersByKeywords(offers ?? [] , meatKeywords, blacklist)
        .sort((a, b) => a.priceBase - b.priceBase).slice(0,5),
        "vegetablesOffer":  filterOffersByKeywords(offers ?? [] , vegetablesKeywords, blacklist)
        .sort((a, b) => a.priceBase - b.priceBase).slice(0,5),
        "supplementsOffer":  filterOffersByKeywords(offers ?? [] , supplementsKeywords, blacklist)
        .sort((a, b) => a.priceBase - b.priceBase).slice(0,5),
        "drinkOffer":  filterOffersByKeywords(offers ?? [] , drinkKeywords, blacklist)
        .sort((a, b) => a.priceBase - b.priceBase).slice(0,5)
    }

    console.log("Offers loaded: ", offer);
    /*
    let response = await fetch(backendUrl, {
        method: 'DELETE'
    });
    console.log("DELETE-Response: ", await response.json())

    response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(offer),
    })
    console.log("POST-Response: ", await response.json())
*/
    console.timeEnd("Load offers");
    return;
})()