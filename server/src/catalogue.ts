/**
 * Catalogue taxonomy and generator.
 *
 * Ported verbatim from the `Site NOVAWEAR.dc.html` prototype so the seeded
 * database reproduces exactly the same 329 articles — same references, names,
 * prices, sizes, badges and photo assignments.
 */

export type SizeSet = readonly string[]

const APP: SizeSet = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const SNK: SizeSet = ['40', '41', '42', '43', '44', '45', '46']
const TU: SizeSet = ['TU']
const BELT: SizeSet = ['85', '90', '95', '100']
const WOM: SizeSet = ['XS', 'S', 'M', 'L', 'XL']
const PANT: SizeSet = ['28', '30', '32', '34', '36']

const WORDS = [
  'Havoc', 'Vortex', 'Static', 'Cipher', 'Onyx', 'Ember', 'Nomad', 'Rogue', 'Vandal', 'Halo',
  'Drift', 'Kilo', 'Ravine', 'Sector', 'Pulse', 'Ghost', 'Metro', 'Atlas', 'Bravo', 'Cobalt',
  'Delta', 'Echo', 'Fable', 'Grid', 'Helix', 'Ion', 'Jolt', 'Krypt', 'Lumen', 'Mirage',
  'Nova', 'Orbit', 'Prism', 'Quartz', 'Rift', 'Slate', 'Tempo', 'Umbra', 'Vault', 'Warp',
  'Xenon', 'Yuma', 'Zephyr', 'Aster', 'Basalt', 'Cinder', 'Dune', 'Eclipse', 'Flint', 'Granite',
  'Horizon', 'Ivory', 'Junction', 'Lattice', 'Monolith', 'Nucleus', 'Obsidian', 'Pylon', 'Quantum', 'Radial',
  'Solstice', 'Terra', 'Union', 'Vertex', 'Wraith', 'Yield', 'Zenith', 'Alloy', 'Beacon', 'Circuit',
  'Domino', 'Fracture', 'Kismet', 'Lynx', 'Mantle', 'Nadir', 'Onset', 'Payload', 'Relic', 'Sable',
  'Talon', 'Vector',
]

export interface SubCategory {
  id: string
  label: string
  /** Base product name, e.g. "Tee Graphic" */
  base: string
  /** Base price in euros, before the per-index offset. */
  price: number
  sizes: SizeSet
}

export interface Category {
  id: string
  code: string
  label: string
  subs: SubCategory[]
}

const sub = (id: string, label: string, base: string, price: number, sizes: SizeSet): SubCategory =>
  ({ id, label, base, price, sizes })

export const CATEGORIES: Category[] = [
  {
    id: 'ts', code: 'TS', label: 'T-SHIRTS', subs: [
      sub('graph', 'Graphiques', 'Tee Graphic', 19.9, APP),
      sub('over', 'Oversize', 'Tee Oversize', 22.9, APP),
      sub('basic', 'Basiques premium', 'Tee Essential', 14.9, APP),
      sub('brand', 'De marques', 'Tee Signature', 29.9, APP),
    ],
  },
  {
    id: 'sw', code: 'SW', label: 'SWEATS & HOODIES', subs: [
      sub('hood', 'Hoodies', 'Hoodie', 34.9, APP),
      sub('crew', 'Crewnecks', 'Crewneck', 29.9, APP),
      sub('zip', 'Zip hoodies', 'Hoodie Zip', 39.9, APP),
    ],
  },
  {
    id: 'pa', code: 'PA', label: 'PANTALONS', subs: [
      sub('jean', 'Jeans', 'Jean', 32.9, PANT),
      sub('bag', 'Baggy', 'Baggy', 29.9, PANT),
      sub('cargo', 'Cargo', 'Cargo', 34.9, PANT),
      sub('jog', 'Joggers', 'Jogger', 24.9, APP),
      sub('cas', 'Pantalons casual', 'Pantalon', 27.9, PANT),
    ],
  },
  {
    id: 've', code: 'VE', label: 'VESTES', subs: [
      sub('bomb', 'Bombers', 'Bomber', 49.9, APP),
      sub('denim', 'Vestes en jean', 'Veste Denim', 44.9, APP),
      sub('light', 'Vestes légères', 'Coach Jacket', 39.9, APP),
      sub('down', 'Doudounes', 'Doudoune', 59.9, APP),
      sub('street', 'Vestes streetwear', 'Veste Street', 49.9, APP),
    ],
  },
  {
    id: 'sn', code: 'SN', label: 'SNEAKERS', subs: [
      sub('life', 'Lifestyle', 'Sneaker', 54.9, SNK),
      sub('run', 'Running', 'Runner', 59.9, SNK),
      sub('bball', 'Basketball', 'Court', 64.9, SNK),
      sub('ltd', 'Éditions limitées', 'Sneaker LTD', 89.9, SNK),
    ],
  },
  {
    id: 'ac', code: 'AC', label: 'ACCESSOIRES', subs: [
      sub('cap', 'Casquettes', 'Casquette', 14.9, TU),
      sub('bon', 'Bonnets', 'Bonnet', 11.9, TU),
      sub('sac', 'Sacs', 'Sac', 29.9, TU),
      sub('lun', 'Lunettes', 'Lunettes', 19.9, TU),
      sub('cein', 'Ceintures', 'Ceinture', 17.9, BELT),
      sub('port', 'Portefeuilles', 'Portefeuille', 19.9, TU),
    ],
  },
  {
    id: 'fe', code: 'FE', label: 'FEMME', subs: [
      sub('top', 'Tops', 'Top', 17.9, WOM),
      sub('hood', 'Hoodies', 'Hoodie W', 34.9, WOM),
      sub('pant', 'Pantalons', 'Pantalon W', 27.9, WOM),
      sub('jean', 'Jeans', 'Jean W', 32.9, PANT),
      sub('veste', 'Vestes', 'Veste W', 44.9, WOM),
      sub('ens', 'Ensembles', 'Ensemble', 39.9, WOM),
    ],
  },
]

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

/**
 * Photo pools, verified visually one photo at a time during design: each
 * subcategory only receives visuals of the right product type (no sneaker
 * filed under "Vestes"). Pool sizes are deliberately uneven — they mirror the
 * photos actually available.
 */
const POOLS: Record<string, number[]> = {
  'ts/graph': range(1, 10), 'ts/over': range(11, 21), 'ts/basic': range(22, 31), 'ts/brand': range(32, 41),
  'sw/hood': range(42, 55).concat([66]), 'sw/crew': range(56, 60), 'sw/zip': range(61, 65).concat(range(67, 69)),
  'pa/jean': range(70, 85), 'pa/bag': range(86, 91), 'pa/cargo': range(92, 103), 'pa/jog': range(104, 112), 'pa/cas': range(113, 121),
  've/bomb': range(122, 137), 've/denim': range(138, 140), 've/light': range(141, 153), 've/down': range(154, 161), 've/street': range(162, 169),
  'sn/life': range(170, 183), 'sn/run': range(184, 195), 'sn/bball': range(196, 203), 'sn/ltd': range(204, 207),
  'ac/cap': range(208, 219), 'ac/bon': range(220, 228), 'ac/sac': range(229, 239), 'ac/lun': range(240, 249), 'ac/cein': range(250, 259), 'ac/port': range(260, 269),
  'fe/top': range(270, 279), 'fe/hood': range(280, 289).concat([329]), 'fe/pant': range(290, 302), 'fe/jean': range(303, 309), 'fe/veste': range(310, 319), 'fe/ens': range(320, 328),
}

const OFFSETS = [0, 3, -2, 6, 2, 9, -3, 4, 7, 12]
const BADGES: (string | null)[] = [null, 'NOUVEAU', null, 'DERNIÈRES PIÈCES', null, 'EXCLU', null, null, 'NOUVEAU', null]

export const DESCRIPTIONS: Record<string, string> = {
  ts: "Coton peigné 240 g/m², coupe tenue à l'épaule et col renforcé. Pièce sourcée à l'unité, état vérifié avant mise en ligne.",
  sw: 'Molleton gratté 380 g/m², intérieur brossé, poignets et bas de corps côtelés. Coupe droite légèrement oversize.',
  pa: 'Denim ou twill épais, surpiqûres contrastées, taille mid-rise et jambe conforme au fit annoncé. Zip métal, passants renforcés.',
  ve: 'Doublure matelassée, zip pleine longueur et col monté. Coupe boxy urbaine, coupe-vent sur les épaules et le dos.',
  sn: "Paire authentifiée, boîte d'origine incluse. Tige cuir / mesh, semelle amortissante, patine nulle à légère selon la pièce.",
  ac: "Finitions cousues, matières premium et logo brodé discret. Pièce d'appoint pensée pour compléter une silhouette sombre.",
  fe: 'Coupe féminine ajustée aux épaules, matière confortable et tombé fluide. Palette neutre pensée pour se superposer.',
}

export const photoPath = (n: number) => '/assets/photos/img' + String(n).padStart(3, '0') + '.jpg'

export interface SeedProduct {
  id: string
  ref: string
  name: string
  catId: string
  subId: string
  priceCents: number
  sizes: string[]
  badge: string | null
  description: string
  image: string
  /** Every photo of the same subcategory, used for the detail gallery. */
  pool: string[]
  position: number
}

/** Rebuilds the 329-article catalogue deterministically. */
export function buildCatalogue(): SeedProduct[] {
  const products: SeedProduct[] = []
  let subIndex = 0
  let position = 0

  for (const cat of CATEGORIES) {
    let n = 1
    for (const s of cat.subs) {
      const pool = POOLS[cat.id + '/' + s.id] ?? []
      for (let i = 0; i < pool.length; i++) {
        const word = WORDS[(subIndex * 7 + i * 3) % WORDS.length]
        const euros = Math.max(9.9, s.price + OFFSETS[i % OFFSETS.length])
        const cut = (subIndex + i) % 3
        const sizes = s.sizes.length > 2
          ? s.sizes.slice(cut === 2 ? 1 : 0, s.sizes.length - (cut === 1 ? 1 : 0))
          : s.sizes

        products.push({
          id: `${cat.id}-${s.id}-${i}`,
          ref: `NW-${cat.code}-${String(n).padStart(3, '0')}`,
          name: `${s.base} ${word}`.toUpperCase(),
          catId: cat.id,
          subId: s.id,
          priceCents: Math.round(euros * 100),
          sizes: [...sizes],
          badge: BADGES[(subIndex + i * 2) % BADGES.length],
          description: DESCRIPTIONS[cat.id],
          image: photoPath(pool[i]),
          pool: pool.map(photoPath),
          position: ++position,
        })
        n++
      }
      subIndex++
    }
  }

  return products
}
