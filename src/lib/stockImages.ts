// lib/stockImages.ts — the brand illustration set offered in the submission form
// when a submitter has no promo image of their own. These are the HubLab "HL"
// motif illustrations already shipped in public/brand/. Each carries ready-made
// alt text so picking one keeps the record accessible without extra typing
// (the submitter can still edit the alt). Paths use the same './brand/…' form as
// the seed records so they resolve under the Pages base.

export interface StockImage {
  /** Path stored on the record's promoImage (resolves under /brand). */
  path: string;
  /** Friendly name shown in the picker. */
  label: string;
  /** Default alt text applied when this image is chosen. */
  alt: string;
}

export const STOCK_IMAGES: StockImage[] = [
  { path: './brand/Robot_HL.png',            label: 'Robot',                 alt: 'Friendly cartoon robot' },
  { path: './brand/Space_Man_HL.png',        label: 'Astronaut',             alt: 'Cartoon astronaut' },
  { path: './brand/Space_Call_Image.png',    label: 'Phone to a planet',     alt: 'Hand holding a retro telephone connected to a planet' },
  { path: './brand/Alien_HL.png',            label: 'Alien in a saucer',     alt: 'Friendly cartoon alien in a flying saucer' },
  { path: './brand/Volcano_HL.png',          label: 'Volcano',               alt: 'Cartoon erupting volcano' },
  { path: './brand/Dinosaur_in_Egg_HL.png',  label: 'Dinosaur hatching',     alt: 'Cartoon dinosaur hatching from an egg' },
  { path: './brand/Butterfly_HL.webp',       label: 'Butterfly',             alt: 'Stylised butterfly illustration' },
  { path: './brand/Venas_Fly_Trap_HL.png',   label: 'Venus flytrap',         alt: 'Cartoon Venus flytrap plant' },
  { path: './brand/Scientific_Microscope_HL.png', label: 'Microscope',       alt: 'Cartoon microscope' },
  { path: './brand/Paper_Plane_HL.png',      label: 'Paper plane',           alt: 'Paper plane with a dotted flight trail' },
  { path: './brand/Game_Controller_HL.png',  label: 'Games controller',      alt: 'Games controller illustration' },
  { path: './brand/Light_switch_HL.png',     label: 'Light switch',          alt: 'Light switch illustration' },
];

/** The stock entry whose path matches, if the current image is a stock pick. */
export const stockByPath = (path: string | undefined | null): StockImage | undefined =>
  path ? STOCK_IMAGES.find(s => s.path === path) : undefined;
