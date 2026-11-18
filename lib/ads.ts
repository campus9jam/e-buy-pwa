/**
 * Homepage advert slots.
 *
 * The homepage renders the ad flagged as default (see DEFAULT_AD_ID). To swap the
 * promotion, either edit the entry below or point DEFAULT_AD_ID at another ad.
 * Keep the copy short: the banner has room for a title, two lines and a CTA.
 */

export interface Advert {
  id: string;
  /** Small label shown above the title, e.g. the product category */
  eyebrow: string;
  title: string;
  body: string;
  /** Up to three short selling points rendered as pills */
  points: string[];
  ctaLabel: string;
  /** Prefilled WhatsApp message used when the customer taps the CTA */
  ctaMessage: string;
  image: string;
  imageAlt: string;
}

export const DEFAULT_AD_ID = "nnpc-engine-oil";

export const ADVERTS: Advert[] = [
  {
    id: "nnpc-engine-oil",
    eyebrow: "Engine care",
    title: "NNPC engine oil, delivered with your ride",
    body: "Keep your new bike running smooth from the first kilometre. Made in Nigeria for Nigerian roads. Add NNPC lubricants to your order and we deliver them with the bike.",
    points: ["NNPC lubricants", "Delivered with your bike", "Ask the agent for sizes"],
    ctaLabel: "Order engine oil",
    ctaMessage:
      "Hello Agent, I would like to order NNPC engine oil. Please share the available sizes and prices.",
    image: "/ads/nnpc-engine-oil.jpg",
    imageAlt: "NNPC lubricants pack shot from NNPC Retail",
  },
];

/** The advert shown on the homepage unless a different id is requested. */
export function getAdvert(id: string = DEFAULT_AD_ID): Advert {
  return ADVERTS.find((ad) => ad.id === id) ?? ADVERTS[0];
}
