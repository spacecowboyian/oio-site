#!/usr/bin/env node
// Pulls the Spreadshop catalog for shop 477761 and writes
// src/data/merch/catalog.json, which merch.astro imports at build time.
//
// Runs at build time, never in the browser: the API key must not ship.
// Usage:  node scripts/sync-catalog.mjs [--details]
//   --details  also fetch per-sellable size lists (slow, one call per published
//              sellable). Skip it while iterating on layout.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SHOP_ID = "477761";
const API = "https://api.spreadshirt.com/api/v1";
const PAGE_SIZE = 48; // fixed by the API, not a preference

const KEY = process.env.SPREADSHIRT_API_KEY ?? (await readEnvKey());
if (!KEY) {
  console.error("SPREADSHIRT_API_KEY missing. Add it to .env or the environment.");
  process.exit(1);
}

async function readEnvKey() {
  try {
    const text = await readFile(join(ROOT, ".env"), "utf8");
    return text.match(/^SPREADSHIRT_API_KEY=(.*)$/m)?.[1].trim();
  } catch {
    return undefined;
  }
}

async function api(path) {
  const url = `${API}/${path}${path.includes("?") ? "&" : "?"}mediaType=json`;
  const res = await fetch(url, {
    headers: {
      Authorization: `SprdAuth apiKey="${KEY}"`,
      "User-Agent": "OIOMerch/0.1 (https://oioracing.com; ratsmee@gmail.com)",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} on ${path}`);
  return res.json();
}

// The sellables endpoint ignores offset/limit and only honours `page`. Paging
// with offset silently re-returns page 0, which looks like a successful sync.
async function fetchSellables() {
  const first = await api(`shops/${SHOP_ID}/sellables?page=0`);
  const pages = Math.ceil(first.count / PAGE_SIZE);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      api(`shops/${SHOP_ID}/sellables?page=${i + 1}`).then((d) => d.sellables)
    )
  );
  const all = [first.sellables, ...rest].flat();

  const seen = new Set();
  const unique = all.filter((s) => !seen.has(s.sellableId) && seen.add(s.sellableId));
  if (unique.length !== first.count) {
    console.warn(`expected ${first.count} sellables, kept ${unique.length} unique`);
  }
  return unique;
}

async function fetchProductTypes(ids) {
  const entries = await Promise.all(
    ids.map(async (id) => {
      const pt = await api(`shops/${SHOP_ID}/productTypes/${id}`);
      return [
        id,
        {
          id,
          name: pt.name,
          category: pt.categoryName,
          brand: pt.brand,
          sizes: Object.fromEntries((pt.sizes ?? []).map((s) => [s.id, s.name])),
          appearances: Object.fromEntries(
            (pt.appearances ?? []).map((a) => [
              a.id,
              { name: a.name, color: a.colors?.[0]?.value ?? null },
            ])
          ),
        },
      ];
    })
  );
  return Object.fromEntries(entries);
}

// Sellable detail needs ideaId AND appearanceId as query params, or it 422s.
function fetchSellableDetail(s, appearanceId) {
  return api(
    `shops/${SHOP_ID}/sellables/${s.sellableId}?ideaId=${s.ideaId}&appearanceId=${appearanceId}`
  );
}

// Size availability is per colourway, not per product: the same Bella + Canvas
// tee stocks S/M/L/XL/2XL/3XL in white but skips L in one heather and M in
// another. One lookup on the default colour would offer sizes that cannot be
// bought, so every published colour gets its own lookup.
async function fetchSizeMatrix(product) {
  const sizesByAppearance = {};
  for (const appearanceId of product.appearanceIds) {
    const detail = await fetchSellableDetail(product, appearanceId);
    sizesByAppearance[appearanceId] = detail.sizeIds ?? [];
    product.images ??= (detail.images ?? []).map((i) => i.url);
  }
  return sizesByAppearance;
}

// Spreadshirt's own categoryName is unusable here: 96 of the 177 product types
// in this shop have it blank and the rest are inconsistent ("hoodie" vs
// "Hoodie" vs "Contrast Hoodie"). Group off the product name instead.
// Order matters: "Men's Premium Long Sleeve T-Shirt" and "Racerback Tank" both
// match the generic tee rule, so the specific cuts are tested first.
const GROUPS = [
  ["Jackets", /jacket|windbreaker|pullover|zip|soft shell/i],
  ["Hoodies", /hoodie|sweatshirt/i],
  ["Long Sleeve", /long sleeve/i],
  ["Tanks", /tank|sleeveless|racerback/i],
  // Before Tees: a "Jersey Beanie" is a hat, not a jersey.
  ["Hats", /cap|beanie|hat/i],
  ["Tees", /t-shirt|tee|jersey|polo/i],
  ["Drinkware", /mug|bottle/i],
  ["Bags", /bag|pouch|fanny|backpack/i],
  ["Small Goods", /button|sticker|mouse pad|pillow|bandana|apron|teddy/i],
];

const groupFor = (name) => GROUPS.find(([, re]) => re.test(name))?.[0] ?? "Other";

// Drives both the drawer's tab order and the hero pick: a design's thumbnail
// should be the tee, not whichever button pack happens to be cheapest. This is
// merchandising order, deliberately not the matching order above.
const GROUP_ORDER = [
  "Tees",
  "Hoodies",
  "Long Sleeve",
  "Tanks",
  "Hats",
  "Bags",
  "Drinkware",
  "Small Goods",
  "Other",
];

/**
 * Relative luminance, 0 (black) to 1 (white), for a #rrggbb hex.
 * Rec. 709 coefficients — good enough to answer "is this light or dark".
 */
function luminance(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * The colourway a card should lead with.
 *
 * Ink colour is fixed per sellable, so a white-ink design on Spreadshop's
 * default white tee is a blank shirt on the shelf — which is exactly what
 * "That's What Speed Do" and the Save the Stick prints looked like. The shop's
 * own default is respected whenever it actually contrasts; only when it fails
 * does this reach for the available colourway furthest from the ink.
 *
 * Designs whose art has no single ink colour (full-colour photos and the like)
 * carry no `Cx` token, and those are left entirely alone — there is no one
 * colour to contrast against and guessing would be worse than the default.
 */
const MIN_CONTRAST = 0.32;

function pickAppearance(variant, appearances) {
  // The shop's default is only a candidate if it survived any garment
  // restriction — otherwise a design limited to dark shirts would still lead
  // with the white one it was told not to offer.
  const offered = variant.appearanceIds;
  const fallback = offered.includes(variant.defaultAppearanceId)
    ? variant.defaultAppearanceId
    : offered[0];
  if (!variant.print) return fallback;

  const inkLum = luminance(variant.print);
  const options = variant.appearanceIds
    .map((id) => ({ id, color: appearances[id]?.color }))
    .filter((a) => a.color);
  if (!options.length) return fallback;

  const current = options.find((a) => a.id === fallback);
  if (current && Math.abs(luminance(current.color) - inkLum) >= MIN_CONTRAST) return fallback;

  const best = options.reduce((a, b) =>
    Math.abs(luminance(b.color) - inkLum) > Math.abs(luminance(a.color) - inkLum) ? b : a
  );
  return best.id;
}

/**
 * Restrict which garment colours a design is offered on.
 *
 * The contrast rule below picks a sensible default *when the ink colour is
 * known*, but a design whose art has no single `Cx` token — line work, anything
 * multi-colour — carries no ink colour to measure, so nothing can be inferred.
 * Corolla FX16 is the case in point: fine light line art that vanishes on white
 * and reads beautifully on black, with no token to prove it either way.
 *
 * `garment: "dark" | "light"` in byDesign states it by hand for those. This
 * governs what the OIO storefront offers and which colourway the Spreadshop
 * link carries; the customer can still switch colour once they are on
 * Spreadshop, which is Spreadshop's page and not ours to restrict.
 */
const GARMENT_MAX_LUM = { dark: 0.35 };
const GARMENT_MIN_LUM = { light: 0.6 };

function restrictAppearances(variant, appearances, garment, only) {
  // An explicit list wins over the luminance rule. Some art needs a specific
  // colourway rather than a category of them: Corolla FX16 is light line work
  // with a dark red "FX16" wordmark, so it needs a garment that carries BOTH —
  // red drowns the wordmark, navy and olive muddy it, and only black holds the
  // two. That is a judgement from looking at the renders, not something
  // luminance can express.
  if (only?.length) {
    const kept = variant.appearanceIds.filter((id) => only.includes(id));
    if (kept.length) return kept;
  }
  if (!garment) return variant.appearanceIds;
  const kept = variant.appearanceIds.filter((id) => {
    const color = appearances[id]?.color;
    if (!color) return false;
    const lum = luminance(color);
    if (garment === "dark") return lum <= GARMENT_MAX_LUM.dark;
    if (garment === "light") return lum >= GARMENT_MIN_LUM.light;
    return true;
  });
  return kept.length ? kept : variant.appearanceIds;
}

// The grid thumbnail is the design's audition, so lead with the best-selling
// form it comes in — cheapest tee if there is one, else the earliest group that
// exists. Falling back to plain cheapest would put a 5-pack of buttons on the
// card and print "from $7.99" under a design that mostly sells as a shirt.
function pickHero(variants) {
  const group = GROUP_ORDER.find((g) => variants.some((v) => v.group === g));
  const pool = variants.filter((v) => v.group === group);
  return pool.reduce((a, b) => (b.price < a.price ? b : a));
}

async function loadOverrides() {
  try {
    return JSON.parse(await readFile(join(ROOT, "src/data/merch/overrides.json"), "utf8"));
  } catch {
    return {};
  }
}

// Product names, blurbs and collections are OIO's, not Spreadshop's. Overrides
// are keyed by ideaId so a rename in the Partner Area can't silently reshuffle
// the storefront. Unknown designs default to hidden — nothing goes live by
// accident, and every design is an explicit yes.
function applyOverrides(design, overrides) {
  const o = overrides[design.ideaId] ?? {};
  return {
    ...design,
    name: o.name ?? design.sourceName,
    blurb: o.blurb ?? design.sourceDescription,
    collection: o.collection ?? "Uncategorized",
    published: o.published === true,
    featured: o.featured === true,
    /* Several designs that are variations on one idea — the three S Generations
       cuts, say — belong on the shelf as a single card with a version switcher,
       not as three near-identical neighbours. `group` names the set, `version`
       names this cut within it, and `groupLead` marks the one whose card
       represents the set. */
    group: o.group ?? null,
    version: o.version ?? null,
    groupLead: o.groupLead === true,
  };
}

const sellables = await fetchSellables();
console.log(`fetched ${sellables.length} sellables`);

const productTypeIds = [...new Set(sellables.map((s) => s.productTypeId))];
const productTypes = await fetchProductTypes(productTypeIds);
console.log(`fetched ${productTypeIds.length} product types`);

const overrides = await loadOverrides();

const byIdea = new Map();
for (const s of sellables) {
  if (!byIdea.has(s.ideaId)) {
    byIdea.set(s.ideaId, {
      ideaId: s.ideaId,
      sourceName: s.name,
      sourceDescription: s.description ?? "",
      tags: s.tags ?? [],
      mainDesignId: s.mainDesignId,
      variants: [],
    });
  }
  const productType = productTypes[s.productTypeId]?.name ?? s.productTypeId;
  byIdea.get(s.ideaId).variants.push({
    sellableId: s.sellableId,
    productTypeId: s.productTypeId,
    productType,
    group: groupFor(productType),
    // Ink color is fixed per sellable (the CxRRGGBB token in vpKey), NOT
    // selectable like garment color. A design printed in black simply has no
    // black-shirt version; that needs a different sellable, which is why the
    // lineup can pin `print`.
    print: s.vpKey?.match(/Cx([0-9A-Fa-f]{6})/)?.[1] ?? null,
    price: s.price.amount,
    image: s.previewImage?.url ?? null,
    appearanceIds: s.appearanceIds ?? [],
    defaultAppearanceId: s.defaultAppearanceId,
  });
}

const designs = [...byIdea.values()]
  .map((d) =>
    applyOverrides({ ...d, catalogSize: d.variants.length, hero: pickHero(d.variants) }, overrides)
  )
  .sort((a, b) => b.catalogSize - a.catalogSize);

// Spreadshop lists every blank it can print on — 120+ per design. That is a
// catalogue dump, not a shop. The lineup is the short list OIO actually sells;
// everything else stays available on Spreadshop but is not merchandised here.
const lineup = JSON.parse(await readFile(join(ROOT, "src/data/merch/lineup.json"), "utf8"));

const products = [];
const missing = [];
for (const design of designs.filter((d) => d.published)) {
  const rules = lineup.byDesign?.[design.ideaId] ?? {};
  const entries = [...lineup.default, ...(rules.add ?? [])]
    .filter((e) => !(rules.remove ?? []).includes(e.productTypeId))
    // A design whose art only reads on a particular blank swaps that lineup
    // slot out by label, keeping its position in the shelf.
    .map((e) => ({ ...e, ...(rules.swap?.[e.label] ?? {}) }));

  for (const entry of entries) {
    // `productTypeIds` is a preference list, tried in order — the first blank
    // the design actually carries wins. The 19 designs that never had a product
    // range enabled each sit on whichever tee they were uploaded onto (210 or
    // 812) while the full-range twelve carry 175; demanding one exact blank
    // would exclude two thirds of the catalogue over a distinction the customer
    // cannot see. A single `productTypeId` still means exactly that blank.
    const candidates = entry.productTypeIds ?? [entry.productTypeId];
    let variant;
    for (const productTypeId of candidates) {
      variant = design.variants.find(
        (v) => v.productTypeId === productTypeId && (!entry.print || v.print === entry.print)
      );
      if (variant) break;
    }
    if (!variant) {
      missing.push(
        `${design.name} — ${entry.label}` +
          (entry.print ? ` (no ${entry.print} print on ${candidates.join("/")})` : "")
      );
      continue;
    }
    const appearanceMeta = productTypes[variant.productTypeId]?.appearances ?? {};
    const appearanceIds = restrictAppearances(
      variant,
      appearanceMeta,
      rules.garment,
      rules.appearanceIds
    );
    const defaultAppearanceId =
      entry.appearanceId ?? pickAppearance({ ...variant, appearanceIds }, appearanceMeta);
    products.push({
      // From the RESOLVED variant, never the entry: an entry using a
      // `productTypeIds` preference list has no single productTypeId, which
      // made every such product `<ideaId>-undefined` and collided the two tees
      // of a design into one map key — silently dropping one of them.
      id: `${design.ideaId}-${variant.productTypeId}`,
      ideaId: design.ideaId,
      designName: design.name,
      collection: design.collection,
      featured: design.featured,
      blurb: design.blurb,
      label: entry.label,
      category: entry.category,
      family: design.group,
      version: design.version,
      // A grouped design only earns a card if it leads its group; the rest are
      // reachable as versions from that card.
      primary: entry.primary === true && (!design.group || design.groupLead),
      productType: variant.productType,
      productTypeId: variant.productTypeId,
      brand: productTypes[variant.productTypeId]?.brand ?? null,
      group: variant.group,
      price: variant.price,
      print: variant.print,
      // Card art must show the colourway the lineup picked, not whatever
      // Spreadshop defaults to. Appearance is encoded in the image path.
      image: variant.image?.replace(/appearanceId=\d+/, `appearanceId=${defaultAppearanceId}`),
      appearanceIds,
      defaultAppearanceId,
      sellableId: variant.sellableId,
    });
  }
}

if (process.argv.includes("--details")) {
  const calls = products.reduce((n, p) => n + p.appearanceIds.length, 0);
  console.log(`fetching size matrix for ${products.length} products (${calls} lookups)...`);
  for (const p of products) {
    p.sizesByAppearance = await fetchSizeMatrix(p);
  }
}

const catalog = {
  shopId: SHOP_ID,
  syncedAt: new Date().toISOString(),
  hasDetails: process.argv.includes("--details"),
  groupOrder: GROUP_ORDER,
  productTypes,
  products,
  // Kept for curation: which designs exist, how big their raw catalogue is, and
  // what is or is not published. The storefront only reads `products`.
  designs: designs.map(({ variants, ...rest }) => rest),
};

await mkdir(join(ROOT, "src/data/merch"), { recursive: true });
await writeFile(join(ROOT, "src/data/merch/catalog.json"), JSON.stringify(catalog, null, 2));

const live = designs.filter((d) => d.published).length;
console.log(
  `wrote src/data/merch/catalog.json — ${products.length} products from ${live} published ` +
    `designs (${designs.length} designs, ${sellables.length} blanks in Spreadshop)`
);
if (live === 0) {
  console.log('nothing published yet: set "published": true in src/data/merch/overrides.json');
}
// Never silently drop a product: a lineup entry that a design cannot print on
// is a curation decision, not a no-op.
for (const m of missing) console.warn(`  not available, skipped: ${m}`);
