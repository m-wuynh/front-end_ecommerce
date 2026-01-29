// allproduct.js
// 100 products mock data (seeded random, stable across reloads)

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function chance(rng, p) {
  return rng() < p;
}

function roundTo(value, step = 1) {
  return Math.round(value / step) * step;
}

function titleCase(str) {
  return str.replace(/\b\w/g, (m) => m.toUpperCase());
}

function sampleUnique(rng, arr, minCount, maxCount) {
  const n = minCount + Math.floor(rng() * (maxCount - minCount + 1));
  const copy = arr.slice();
  // Fisher–Yates shuffle (seeded)
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

function makeDetail(rng, category, tags) {
  const style = tags && tags.length ? tags[0] : "casual";
  const typeLabel = {
    "t-shirts": "T-shirt",
    shorts: "Shorts",
    shirts: "Shirt",
    hoodie: "Hoodie",
    jeans: "Jeans",
  };

  const materialByCategory = {
    "t-shirts": ["100% cotton", "cotton jersey", "cotton blend"],
    shorts: ["cotton twill", "poly-cotton blend", "lightweight nylon"],
    shirts: ["oxford cotton", "poplin cotton", "cotton-linen blend"],
    hoodie: ["brushed fleece", "cotton fleece", "cotton-poly blend"],
    jeans: ["denim", "stretch denim", "rigid denim"],
  };

  const fitOptions = ["Regular fit", "Relaxed fit", "Slim fit", "Oversized fit"];

  const featurePool = [
    "Soft hand-feel",
    "Breathable fabric",
    "Easy to style",
    "Durable stitching",
    "Comfort stretch",
    "All-day comfort",
  ];

  const carePool = [
    "Machine wash cold",
    "Wash with similar colors",
    "Do not bleach",
    "Tumble dry low",
    "Cool iron if needed",
  ];

  const features = sampleUnique(rng, featurePool, 2, 4);
  const care = sampleUnique(rng, carePool, 3, 5);

  const introTemplates = [
    `A comfortable ${typeLabel[category]} made for a ${style} look. Easy to pair and ready for everyday wear.`,
    `Your go-to ${typeLabel[category]} for ${style} outfits—clean, versatile, and built for comfort.`,
    `A modern ${typeLabel[category]} designed with a ${style} vibe. Soft fabric, solid fit, and effortless styling.`,
  ];

  return {
    intro: pick(rng, introTemplates),
    material: titleCase(pick(rng, materialByCategory[category])),
    fit: pick(rng, fitOptions),
    features,
    care,
  };
}

function generateProducts(count = 100, seed = 20260128) {
  const rng = mulberry32(seed);

  // Categories
  const categories = ["t-shirts", "shorts", "shirts", "hoodie", "jeans"];

  // Style tags + flag tags
  const styleTags = ["casual", "formal", "party", "gym"];
  const flagTags = ["new", "onsale", "best-seller"];

  // Price ranges by category
  const priceRanges = {
    "t-shirts": [50, 180],
    shorts: [40, 120],
    shirts: [70, 220],
    hoodie: [90, 260],
    jeans: [80, 300],
  };

  // Image pool (replace with your real images later)
  const imagePool = {
    "t-shirts": ["./img/ao_den.png", "./img/ao_soc_cam.png", "./img/ao_cam.png"],
    shorts: ["./img/jean_xanh_ngan.png", "./img/jean_xanh_ngan.png"],
    shirts: ["./img/ao_soc_do.png", "./img/ao_soc_xanh.png"],
    hoodie: ["./img/ao_den.png", "./img/ao_cam.png"],
    jeans: ["./img/jean_xanh_dai.png", "./img/jean_den.png"],
  };

  // Visual/product naming
  const adj = [
    "Classic", "Oversized", "Slim Fit", "Relaxed", "Essential", "Premium",
    "Graphic", "Striped", "Vintage", "Minimal", "Sport", "Street",
    "Comfort", "Urban", "Signature", "Cotton", "Denim", "Bold"
  ];

  const typeLabel = {
    "t-shirts": "T-shirt",
    shorts: "Shorts",
    shirts: "Shirt",
    hoodie: "Hoodie",
    jeans: "Jeans",
  };

  // Colors (no slug)
const colorPool = [
  { label: "Green",  hex: "#2E7D32" },
  { label: "Red",    hex: "#D7263D" },
  { label: "Yellow", hex: "#FFC107" },
  { label: "Orange", hex: "#FF9800" },
  { label: "Cyan",   hex: "#00BCD4" },
  { label: "Blue",   hex: "#2D6CDF" },
  { label: "Purple", hex: "#6A1B9A" },
  { label: "Pink",   hex: "#E91E63" },
  { label: "Black",  hex: "#000000" },
  { label: "White",  hex: "#FFFFFF" },
];


  const sizesTops = ["XS", "S", "M", "L", "XL"];
  const sizesBottoms = ["28", "30", "32", "34", "36"];
  const sizesShorts = ["S", "M", "L", "XL"];

  const products = [];

  for (let i = 1; i <= count; i++) {
    const category = pick(rng, categories);

    // Always 1 main style
    const tags = [pick(rng, styleTags)];

    // Add flags randomly
    if (chance(rng, 0.35)) tags.push("new");
    if (chance(rng, 0.30)) tags.push("best-seller");
    if (chance(rng, 0.28)) tags.push("onsale");

    // Unique tags
    const uniqueTags = Array.from(new Set(tags));

    const [minP, maxP] = priceRanges[category];
    const price = roundTo(minP + rng() * (maxP - minP), 1);

    // rating 3.0 → 5.0 step 0.1
    const rating = Math.min(5, Math.max(3, roundTo(3 + rng() * 2, 0.1)));

    // oldPrice only if on-sale
    let oldPrice = null;
    if (uniqueTags.includes("onsale")) {
      const bump = 1.1 + rng() * 0.35; // 10% → 45%
      oldPrice = roundTo(price * bump, 1);
      if (oldPrice <= price) oldPrice = price + 10;
    }

    const name =
      `${pick(rng, adj)} ${pick(rng, adj)} ${typeLabel[category]}`.replace(/\s+/g, " ");
    const image = pick(rng, imagePool[category]);

    // Pick 2–4 colors per product
    const colors = sampleUnique(rng, colorPool, 2, 4);

    // Sizes by category
    let sizes = sizesTops;
    if (category === "jeans") sizes = sizesBottoms;
    if (category === "shorts") sizes = sizesShorts;

    const detail = makeDetail(rng, category, uniqueTags);

    products.push({
      id: i,
      name: titleCase(name.toLowerCase()),
      price,
      oldPrice,
      rating,
      image,
      category,
      tag: uniqueTags,

      // ✅ New attributes
      colors,   // [{label, hex}]
      sizes,    // ["S","M","L"...] or ["28","30"...]
      detail,   // English introduction + info
    });
  }

  return products;
}

// ✅ this is the variable your project can import/use
const PRODUCTS = generateProducts(100, 20260128);
