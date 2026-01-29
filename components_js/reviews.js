// reviews.js
// Generate mock product reviews by productId (stable across reloads via seeded RNG)
// Usage (after loading allproduct.js):
//   const reviews = getReviewsByProductId(12);
//   const stats = getReviewStats(12);
//
// Note: This file assumes PRODUCTS exists in global scope (from allproduct.js).

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (a >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function chance(rng, p) {
  return rng() < p;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function roundTo(value, step = 1) {
  return Math.round(value / step) * step;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isoDateFromDaysAgo(daysAgo) {
  // Create a deterministic-ish date string without relying on timezone differences
  // We'll use today's date at runtime and subtract days.
  const d = new Date();
  d.setHours(12, 0, 0, 0); // stable midday
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function makeReviewText(rng, product, stars) {
  const positives = [
    "Fit is exactly as expected.",
    "Fabric feels premium for the price.",
    "Color matches the photos.",
    "Very comfortable for daily wear.",
    "Stitching looks solid and neat.",
    "Easy to style with different outfits.",
    "Good value and would buy again.",
  ];
  const neutrals = [
    "Sizing runs slightly small, consider sizing up.",
    "Material is lighter than I expected but still fine.",
    "Color is a bit different in real life (still nice).",
    "Packaging was okay and delivery was on time.",
    "Works best after the first wash.",
  ];
  const negatives = [
    "Fit wasn't right for me.",
    "Material feels thinner than expected.",
    "Color faded a little after washing.",
    "Stitching could be better in some areas.",
    "Not as soft as I hoped.",
  ];

  const openings = [
    "Bought this recently and here are my thoughts.",
    "After a week of wearing it, I can say:",
    "First impression was good, and after a few wears:",
    "Tried this for a trip/workout and noticed:",
  ];

  const closings = [
    "Overall I'm happy with it.",
    "I'd recommend it if you like this style.",
    "Might reorder in another color.",
    "Hope this helps!",
  ];

  let pool = positives;
  if (stars === 3) pool = positives.concat(neutrals);
  if (stars <= 2) pool = negatives.concat(neutrals);

  const lines = [];
  lines.push(pick(rng, openings));
  const lineCount = 2 + Math.floor(rng() * 3); // 2-4 lines
  for (let i = 0; i < lineCount; i++) lines.push(pick(rng, pool));

  // add 1 product-specific line
  const specifics = [
    `I got the ${product.category} for a ${product.tag?.[0] || "casual"} look.`,
    `Price feels ${stars >= 4 ? "worth it" : "okay"} for what you get.`,
    `Works well with my usual wardrobe.`,
    `The ${product.detail?.material || "fabric"} is a nice touch.`,
  ];
  lines.push(pick(rng, specifics));
  lines.push(pick(rng, closings));

  return lines.join(" ");
}

function makeReviewTitle(rng, product, stars) {
  const good = ["Love it", "Great quality", "Perfect fit", "So comfy", "Nice piece", "Recommend"];
  const ok = ["Pretty good", "Decent for the price", "Not bad", "Okay overall", "Mixed feelings"];
  const bad = ["Disappointed", "Not for me", "Could be better", "Quality issue", "Wouldn't reorder"];

  const cat = {
    "t-shirts": "T-shirt",
    shorts: "Shorts",
    shirts: "Shirt",
    hoodie: "Hoodie",
    jeans: "Jeans",
  }[product.category] || "Item";

  const base = stars >= 4 ? good : stars === 3 ? ok : bad;
  return `${pick(rng, base)} ${cat}`;
}

function generateReviewsForProducts(products, seed = 20260129) {
  const rng = mulberry32(seed);

const firstNames = [
  "Alex", "James", "Michael", "Daniel", "Chris",
  "David", "John", "Ryan", "Kevin", "Andrew",
  "Emma", "Olivia", "Sophia", "Emily", "Ava",
  "Mia", "Isabella", "Charlotte", "Amelia", "Grace"
];

const lastNames = [
  "Smith", "Johnson", "Brown", "Taylor", "Anderson",
  "Thompson", "White", "Harris", "Martin", "Clark",
  "Lewis", "Walker", "Hall", "Young", "King"
];

  const sizePoolByCategory = {
    "t-shirts": ["XS", "S", "M", "L", "XL"],
    shirts: ["XS", "S", "M", "L", "XL"],
    hoodie: ["XS", "S", "M", "L", "XL"],
    jeans: ["28", "30", "32", "34", "36"],
    shorts: ["S", "M", "L", "XL"],
  };

  const reviews = [];
  let rid = 1;

  products.forEach((p) => {
    // 1–8 reviews each product (more likely for best-seller)
    const base = 1 + Math.floor(rng() * 5); // 1-5
    const extra = p.tag && p.tag.includes("best-seller") ? (chance(rng, 0.7) ? 3 : 1) : 0;
    const count = clamp(base + extra, 1, 8);

    for (let i = 0; i < count; i++) {
      // Bias around product.rating but allow 1-5
      const noise = (rng() - 0.5) * 1.6; // -0.8..0.8
      const stars = clamp(Math.round(p.rating + noise), 1, 5);

      const author = `${pick(rng, firstNames)} ${pick(rng, lastNames)}`;

      const colors = Array.isArray(p.colors) && p.colors.length ? p.colors : [{ label: "Black" }];
      const sizes = sizePoolByCategory[p.category] || (Array.isArray(p.sizes) ? p.sizes : ["M"]);

      const daysAgo = 2 + Math.floor(rng() * 240); // within ~8 months
      const date = isoDateFromDaysAgo(daysAgo);

      reviews.push({
        id: rid++,
        productId: p.id,
        author,
        rating: stars,
        title: makeReviewTitle(rng, p, stars),
        body: makeReviewText(rng, p, stars),
        date, // "YYYY-MM-DD"
        verified: chance(rng, 0.62),
        variant: {
          color: pick(rng, colors).label,
          size: pick(rng, sizes),
        },
        helpfulCount: Math.floor(rng() * 31), // 0-30
      });
    }
  });

  // Newest first per product (easy rendering)
  reviews.sort((a, b) => {
    if (a.productId !== b.productId) return a.productId - b.productId;
    return b.date.localeCompare(a.date);
  });

  return reviews;
}

// ✅ Main dataset
// If PRODUCTS isn't available yet, REVIEWS will be [] and you can call initReviews() later.
let REVIEWS = [];
function initReviews(seed = 20260129) {
  if (typeof PRODUCTS === "undefined" || !Array.isArray(PRODUCTS)) {
    console.warn("[reviews.js] PRODUCTS not found. Load allproduct.js first.");
    REVIEWS = [];
    return REVIEWS;
  }
  REVIEWS = generateReviewsForProducts(PRODUCTS, seed);
  return REVIEWS;
}

// Auto-init if possible
try { initReviews(20260129); } catch (e) { /* ignore */ }

// ✅ Helpers
function getReviewsByProductId(productId, { sort = "newest" } = {}) {
  const list = REVIEWS.filter((r) => r.productId === Number(productId));
  if (sort === "helpful") return list.slice().sort((a, b) => b.helpfulCount - a.helpfulCount);
  // default newest (already sorted by date desc inside each product, but keep safe)
  return list.slice().sort((a, b) => b.date.localeCompare(a.date));
}

function getReviewStats(productId) {
  const list = getReviewsByProductId(productId);
  const count = list.length;
  if (!count) return { productId: Number(productId), count: 0, avg: 0, breakdown: { 1:0,2:0,3:0,4:0,5:0 } };

  const breakdown = { 1:0,2:0,3:0,4:0,5:0 };
  let sum = 0;
  list.forEach((r) => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; sum += r.rating; });
  const avg = roundTo(sum / count, 0.1);

  return { productId: Number(productId), count, avg, breakdown };
}

// ✅ Optional: expose to window for convenience
// (safe even if running in module-like contexts)
if (typeof window !== "undefined") {
  window.REVIEWS = REVIEWS;
  window.initReviews = initReviews;
  window.getReviewsByProductId = getReviewsByProductId;
  window.getReviewStats = getReviewStats;
}
