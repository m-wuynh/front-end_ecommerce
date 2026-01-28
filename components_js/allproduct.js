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

function generateProducts(count = 100, seed = 20260128) {
  const rng = mulberry32(seed);

  // Categories (slug để dùng trên URL/filter)
  const categories = ["t-shirts", "shorts", "shirts", "hoodie", "jeans"];

  // “Style” tags + “flag” tags (đúng ý bạn)
  const styleTags = ["casual", "formal", "party", "gym"];
  const flagTags = ["new", "onsale", "best-seller"];

  // Price ranges theo category (tuỳ bạn chỉnh)
  const priceRanges = {
    "t-shirts": [50, 180],
    shorts: [40, 120],
    shirts: [70, 220],
    hoodie: [90, 260],
    jeans: [80, 300],
  };

  // Image pool: dùng tạm ảnh bạn đã có để đỡ bị broken image
  // (Hoodie/Shorts tạm dùng ảnh có sẵn; sau bạn thay đường dẫn ảnh thật)
  const imagePool = {
    "t-shirts": ["./img/ao_den.png", "./img/ao_soc_cam.png", "./img/ao_cam.png"],
    shorts: ["./img/jean_xanh_ngan.png", "./img/jean_xanh_ngan.png"],
    shirts: ["./img/ao_soc_do.png", "./img/ao_soc_xanh.png"],
    hoodie: ["./img/ao_den.png", "./img/ao_cam.png"],
    jeans: ["./img/jean_xanh_dai.png", "./img/jean_den.png"],
  };

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

  const products = [];

  for (let i = 1; i <= count; i++) {
    const category = pick(rng, categories);

    // luôn có 1 style chính
    const tags = [pick(rng, styleTags)];

    // thêm flag tags ngẫu nhiên
    if (chance(rng, 0.35)) tags.push("new");
    if (chance(rng, 0.30)) tags.push("best-seller");
    if (chance(rng, 0.28)) tags.push("onsale");

    // tránh trùng tag
    const uniqueTags = Array.from(new Set(tags));

    const [minP, maxP] = priceRanges[category];
    const price = roundTo(minP + rng() * (maxP - minP), 1);

    // rating 3.0 → 5.0 bước 0.1
    const rating = Math.min(5, Math.max(3, roundTo(3 + rng() * 2, 0.1)));

    // oldPrice chỉ khi on-sale
    let oldPrice = null;
    if (uniqueTags.includes("onsale")) {
      const bump = 1.1 + rng() * 0.35; // tăng 10% → 45%
      oldPrice = roundTo(price * bump, 1);
      if (oldPrice <= price) oldPrice = price + 10;
    }

    const name =
      `${pick(rng, adj)} ${pick(rng, adj)} ${typeLabel[category]}`.replace(/\s+/g, " ");
    const image = pick(rng, imagePool[category]);

    products.push({
      id: i,
      name: titleCase(name.toLowerCase()),
      price,
      oldPrice,
      rating,
      image,
      category,
      tag: uniqueTags,
    });
  }

  return products;
}

// ✅ đây là biến bạn đang dùng trong project
const PRODUCTS = generateProducts(100, 20260128);
