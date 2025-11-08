import { Offer } from '../types/offer.type';

export function filterOffersByKeywords(offers: Offer[], keywords: string[], blacklist: string[]): Offer[] {
    return offers.filter(
        (offer, index, self) =>
            (index === self.findIndex((o) => o.title === offer.title)) &&
            (keywords.some(word => offer.title.toLowerCase().includes(word))) &&
            (!blacklist.some(bad => offer.title.toLowerCase().includes(bad)))
    );
}
