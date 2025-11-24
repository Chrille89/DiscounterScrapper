import { OfferInfo } from '../types/offer.type';

export function filterOffersByKeywords(offers: OfferInfo[], keywords: string[], blacklist: string[]): OfferInfo[] {
    return offers.filter(
        (offer, index, self) =>
            (index === self.findIndex((o) => o.title === offer.title)) &&
            (offer.title.length < 150) &&
            (!Number.isNaN(offer.priceBase)) &&
            (keywords.some(word => offer.title.toLowerCase().includes(word.toLowerCase()))) &&
            (!blacklist.some(bad => offer.title.toLowerCase().includes(bad.toLowerCase())))
    );
}
