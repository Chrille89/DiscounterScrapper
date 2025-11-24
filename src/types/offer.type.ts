export type Offer = {
    meatOffer?: OfferInfo[],
    vegetablesOffer?: OfferInfo[],
    supplementsOffer?: OfferInfo[],
    drinkOffer?: OfferInfo[]
}

export type OfferInfo = {
    title: string,
    amount: string,
    price: number,
    priceOld: string | undefined,
    percentSaving: string | undefined,
    priceBase: number,
    discounter: string
}