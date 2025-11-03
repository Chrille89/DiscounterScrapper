import { getAldiOffers } from "./aldiOffers"
import { getNettoOffers } from "./nettoOffers"

(async () => {
    let offers = await getAldiOffers()
    let nettoOffers = await getNettoOffers()
    if (nettoOffers)
        offers?.push(...nettoOffers)

    offers = offers?.sort((a, b) => a.priceBase - b.priceBase).slice(0, 5)
    console.log("Offers: ", offers)

    fetch('http://h2857701.stratoserver.net:3001', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(offers),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Response:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });

})()