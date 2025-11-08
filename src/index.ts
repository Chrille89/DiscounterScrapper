import { getAldiOffers } from "./aldiOffers"
import { getNettoDiscountOffers } from "./nettoDiscountOffers"
import { getNettoOffers } from "./nettoOffers"
import { getPennyOffers } from "./pennyOffers";
import { getReweOffers } from "./reweOffer";
import { getNormaOffers } from "./normaOffers";

(async () => {
    console.time("Load offers");
    
    let offers = await getNormaOffers()
    console.log("Norma offers found: ", offers);
    /*
    // ALDI
    let offers = await getAldiOffers()

    // NETTO Marken Discount
    let nettoOffers = await getNettoDiscountOffers()
    if (nettoOffers)
        offers?.push(...nettoOffers)

    // NETTO
    offers?.push(...await getNettoOffers("https://netto.de/angebote/spar-stars/") ?? [])
    offers?.push(...await getNettoOffers("https://netto.de/angebote/regionale-produkte/") ?? [])
    offers?.push(...await getNettoOffers("https://netto.de/angebote/hammer-donnerstag/") ?? [])        
    offers?.push(...await getNettoOffers("https://netto.de/angebote/knaller-wochenende/") ?? [])

    // PENNY
    offers?.push(...await getPennyOffers() ?? [])

    // Rewe
    offers?.push(...await getReweOffers() ?? [])

    offers = offers?.sort((a, b) => a.priceBase - b.priceBase).slice(0, 5)

    let response = await fetch('http://h2857701.stratoserver.net:3001', {
        method: 'DELETE'
    });
    console.log("DELETE-Response: ",await response.json())

    response = await fetch('http://h2857701.stratoserver.net:3001', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(offers),
    })
    console.log("POST-Response: ",await response.json())*/
    console.timeEnd("Load offers");

})()