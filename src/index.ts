import { getAldiOffers } from "./aldiOffers"
import { getNettoDiscountOffers } from "./nettoDiscountOffers"
import { getNettoOffers } from "./nettoOffers"
import { getPennyOffers } from "./pennyOffers";
import { getReweOffers } from "./reweOffers";
import { getNormaOffers } from "./normaOffers";
import { getEdekaOffers } from "./edekaOffers";
import { blacklist, meatKeywords } from './helper/meatKeywords';
import { filterOffersByKeywords } from "./helper/offerFilter";
import { getKauflandOffers } from "./kauflandOffers";

(async () => {
    console.time("Load offers");

    // ALDI
    console.log("Loading ALDI offers...")
    let offers = await getAldiOffers()

    // NETTO Marken Discount
    console.log("Loading Netto Marken-Discount offers...")
    let nettoOffers = await getNettoDiscountOffers()
    if (nettoOffers)
        offers?.push(...nettoOffers)

    // NETTO
    console.log("Loading Netto offers...")
    offers?.push(...await getNettoOffers("https://netto.de/angebote/spar-stars/") ?? [])
    offers?.push(...await getNettoOffers("https://netto.de/angebote/regionale-produkte/") ?? [])
    offers?.push(...await getNettoOffers("https://netto.de/angebote/hammer-donnerstag/") ?? [])
    offers?.push(...await getNettoOffers("https://netto.de/angebote/knaller-wochenende/") ?? [])

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
    
    offers = filterOffersByKeywords(offers ?? [] , meatKeywords, blacklist)
        .sort((a, b) => a.priceBase - b.priceBase)
        .slice(0,5)

    let response = await fetch('http://h2857701.stratoserver.net:3001', {
        method: 'DELETE'
    });
    console.log("DELETE-Response: ", await response.json())

    response = await fetch('http://h2857701.stratoserver.net:3001', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(offers),
    })
    console.log("POST-Response: ", await response.json())

    console.timeEnd("Load offers");

})()