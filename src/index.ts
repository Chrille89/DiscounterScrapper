import { getAldiOffers } from "./aldiOffers"
import { getNettoOffers } from "./nettoOffers"


(async () => {
    let offers = await getAldiOffers()
    let nettoOffers = await getNettoOffers()
    if (nettoOffers)
        offers?.push(...nettoOffers)

    offers = offers?.sort((a, b) => a.priceBase - b.priceBase).slice(0, 3)

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
    console.log("POST-Response: ",await response.json())

})()