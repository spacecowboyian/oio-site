#!/usr/bin/env node
// Generates src/styles/apex.css from the Apex brand tokens.
//
// Authority is oio-apex/packages/tokens/tokens.json. This file used to be a
// hand-copied mirror of it, which is exactly how brand values drift: a hex
// changes upstream and nothing here notices. Now the CSS is generated, and
// `npm run tokens:check` fails if it has fallen behind.
//
// The generated CSS is COMMITTED on purpose. The Pages deploy builds from a
// checkout of this repo alone and has no access to oio-apex, so the build must
// not depend on the tokens repo being present — only the sync does.
//
//   node scripts/sync-apex-tokens.mjs           write src/styles/apex.css
//   node scripts/sync-apex-tokens.mjs --check   exit 1 if it is out of date
//
// Point OIO_APEX at the tokens repo if it does not sit beside this one.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const apex = process.env.OIO_APEX ?? resolve(root, "..", "oio-apex");
const tokensPath = join(apex, "packages", "tokens", "tokens.json");
const outPath = join(root, "src", "styles", "apex.css");

let tokens;
try {
  tokens = JSON.parse(readFileSync(tokensPath, "utf-8"));
} catch (err) {
  console.error(`Cannot read Apex tokens at ${tokensPath}\n  ${err.message}`);
  console.error("Clone spacecowboyian/oio-apex beside this repo, or set OIO_APEX.");
  process.exit(1);
}

const { base } = tokens.color;

// Hex case is not consistent upstream (base.* is lower, the ramps are upper).
// CSS does not care, but a stable case keeps the generated diff to real value
// changes instead of noise.
const hex = (v) => (/^#[0-9a-fA-F]{3,8}$/.test(v) ? v.toLowerCase() : v);
const stack = (name) => tokens.type.fonts[name].stack.map((f) => (f.includes(" ") ? `"${f}"` : f)).join(", ");
const scale = tokens.type.scale;

// Only the steps the site actually uses. heroSm..heroXl exist upstream and are
// deliberately left out: nothing on the site is at that size, and an unused
// custom property is an invitation to reach for a size the design never chose.
const SCALE_STEPS = ["caption", "body", "h6", "h5", "h4", "h3", "h2", "h1"];

const css = `/* =========================================================
   Apex — OIO Racing design system

   GENERATED FILE — do not edit by hand.
   Source: oio-apex/packages/tokens/tokens.json
   Regenerate: npm run tokens:sync    Verify: npm run tokens:check

   Exposed twice on purpose: as \`--apex-*\` custom properties for hand-written
   component CSS, and through Tailwind's \`@theme\` so utility classes
   (\`bg-surface\`, \`text-spark\`, \`border-line\`) resolve to the same values. The
   site currently uses Tailwind's zinc palette, which is not Apex; these tokens
   are what it should migrate onto.
   ========================================================= */

:root {
  /* Grounds — Apex is a dark brand and commits to it. There is no light
     ground; adding one means adding tokens upstream, not guessing a hex. */
  --apex-surface: ${hex(base.surface)};
  --apex-surface-2: ${hex(base.surface2)};
  --apex-black: ${hex(base.black)};

  /* Neutrals — roles are measured (color.contrast), not nominal */
  --apex-white: ${hex(base.white)}; /* 18.37:1 on Surface */
  --apex-steel-light: ${hex(base.muted)}; /* 5.85:1 — body text, labels, eyebrows */
  --apex-steel: ${hex(base.muted2)}; /* 3.10:1 — 24px+ only, never on Surface 2 */
  --apex-steel-dark: ${hex(base.line)}; /* 1.49:1 — hairlines only, never text */

  /* Mood cores — pick ONE per piece, never both as co-headlines */
  --apex-spark: ${hex(tokens.color.core.spark.ramp["500"])}; /* payoff, victory */
  --apex-spark-700: ${hex(tokens.color.core.spark.ramp["700"])};
  --apex-grit: ${hex(tokens.color.core.grit.ramp["500"])}; /* struggle, mechanical — large text only */

  /* Support — not mood picks */
  --apex-rust: ${hex(tokens.color.support.rust.ramp["500"])}; /* vintage/patina only */
  --apex-flag: ${hex(tokens.color.support.flag.ramp["500"])}; /* confirmation/pricing signal only */

  /* Type — Helvetica does the lifting at every size. Condensed Black and
     SignPainter stay in their lanes and are never the display face. */
  --apex-font-lead: ${stack("helvetica")};
  --apex-font-mono: ${stack("mono")};

  /* Scale — named steps. Fluid sizes clamp BETWEEN two steps rather than
     inventing values in between. */
${SCALE_STEPS.map((s) => `  --apex-${s}: ${scale[s]};`).join("\n")}
}

@theme {
  --color-surface: ${hex(base.surface)};
  --color-surface-2: ${hex(base.surface2)};
  --color-steel-light: ${hex(base.muted)};
  --color-steel: ${hex(base.muted2)};
  --color-line: ${hex(base.line)};
  --color-spark: ${hex(tokens.color.core.spark.ramp["500"])};
  --color-spark-700: ${hex(tokens.color.core.spark.ramp["700"])};
  --color-grit: ${hex(tokens.color.core.grit.ramp["500"])};

  --font-lead: ${stack("helvetica")};
  --font-mono: ${stack("mono")};

  /* The Never Round A Corner Rule: square everywhere. The circle system
     (badges, rank circles, connector marks) is the one exception and is
     always fully round — use \`rounded-full\`, never a partial radius. */
  --radius-none: ${tokens.shape.radius.none};
}

/* The Never Italic Rule — weight and colour carry emphasis. Backstop, since
   markdown and pasted copy reintroduce slants constantly. */
:where(i, em, cite, address) {
  font-style: normal;
}
`;

if (process.argv.includes("--check")) {
  const current = readFileSync(outPath, "utf-8");
  if (current === css) {
    console.log("apex.css is in sync with oio-apex tokens.json");
    process.exit(0);
  }
  console.error("apex.css is OUT OF DATE with oio-apex/packages/tokens/tokens.json.");
  console.error("Run: npm run tokens:sync");
  process.exit(1);
}

writeFileSync(outPath, css);
console.log(`Wrote ${outPath} from ${tokensPath}`);
