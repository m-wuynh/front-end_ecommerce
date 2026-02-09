function getId() {
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));
  return Number.isFinite(id) ? id : null;
}

function discountPercent(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round((1 - price / oldPrice) * 100);
}

function isLight(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 180;
}

document.addEventListener("DOMContentLoaded", () => {
  const id = getId();
  const root = document.getElementById("pdRoot");

  if (!id) {
    root.innerHTML = `<p>Thiếu id. Ví dụ: product_detail.html?id=1</p>`;
    return;
  }

  // PRODUCTS đến từ allproduct.js
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) {
    root.innerHTML = `<p>Không tìm thấy sản phẩm (id=${id})</p>`;
    return;
  }

  // Breadcrumb category
  document.getElementById("bcCategory").textContent = product.category;

  const gallery = Array.isArray(product.images) && product.images.length
    ? product.images
    : [product.image];

  // State
  let activeThumb = 0;
  let colorIndex = 0;
  let sizeValue = product.sizes?.[0] ?? null;
  let qty = 1;

  function render() {
    const off = discountPercent(product.price, product.oldPrice);

    root.innerHTML = `
      <div class="pd-layout">
        <!-- LEFT thumbs -->
        <div class="pd-thumbs">
          ${gallery.map((src, i) => `
            <button class="pd-thumb ${i === activeThumb ? "active" : ""}" data-thumb="${i}">
              <img src="${src}" alt="thumb ${i + 1}">
            </button>
          `).join("")}
        </div>

        <!-- MIDDLE image -->
        <div class="pd-main">
          <img id="mainImg" src="${gallery[activeThumb]}" alt="${product.name}">
        </div>

        <!-- RIGHT info -->
        <div class="pd-info">
          <h1>${product.name}</h1>

          <div class="pd-rating">
            <span class="stars">${createStars(product.rating)}</span>
            <span class="text">${Number(product.rating).toFixed(1)}/5</span>
          </div>

          <div class="pd-price">
            <span class="current">$${product.price}</span>
            ${product.oldPrice ? `<span class="old">$${product.oldPrice}</span>` : ""}
            ${off ? `<span class="badge">-${off}%</span>` : ""}
          </div>

          <p class="pd-intro">${product.detail?.intro ?? ""}</p>

          <div class="hr"></div>

          <p class="section-title">Select Colors</p>
          <div class="pd-colors">
            ${(product.colors || []).map((c, idx) => `
              <button
                class="color-btn ${idx === colorIndex ? "selected" : ""} ${isLight(c.hex) ? "light" : ""}"
                style="background:${c.hex}"
                data-color="${idx}"
                title="${c.label}"
                aria-label="${c.label}"
              >
                ${idx === colorIndex ? `<span class="check">✓</span>` : ""}
              </button>
            `).join("")}
          </div>

          <div class="hr"></div>

          <p class="section-title">Choose Size</p>
          <div class="pd-sizes">
            ${(product.sizes || []).map((s) => `
              <button class="size-btn ${s === sizeValue ? "selected" : ""}" data-size="${s}">
                ${s}
              </button>
            `).join("")}
          </div>

          <div class="hr"></div>

          <div class="pd-actions">
            <div class="qty">
              <button id="minus" type="button" aria-label="Decrease quantity">−</button>
              <input id="qtyInput" class="qty-input" type="number" min="1" step="1" value="${qty}" inputmode="numeric"/>
              <button id="plus" type="button" aria-label="Increase quantity">+</button>
            </div>
            <button class="add-btn" id="addCart">Add to Cart</button>
          </div>
        </div>
      </div>
    `;
    setupGalleryAutoSlide(
      root,
      gallery,
      () => activeThumb,
      (idx) => {
        activeThumb = idx;
        render(); // vì code bạn đang render lại khi đổi thumb
      }
    );

    // events: thumbs
    root.querySelectorAll(".pd-thumb").forEach(btn => {
      btn.addEventListener("click", () => {
        activeThumb = Number(btn.dataset.thumb);
        render();
      });
    });

    // events: colors
    root.querySelectorAll(".color-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        colorIndex = Number(btn.dataset.color);
        render();
      });
    });

    // events: sizes
    root.querySelectorAll(".size-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        sizeValue = btn.dataset.size;
        render();
      });
    });

    // events: qty
    const qtyInput = root.querySelector("#qtyInput");

    root.querySelector("#minus").addEventListener("click", () => {
      qty = Math.max(1, qty - 1);
      if (qtyInput) qtyInput.value = String(qty);
    });

    root.querySelector("#plus").addEventListener("click", () => {
      qty += 1;
      if (qtyInput) qtyInput.value = String(qty);
    });

    // cho phép nhập số trực tiếp
    qtyInput?.addEventListener("input", () => {
      // cho phép user xóa tạm thời (để gõ lại)
      if (qtyInput.value === "") return;

      const n = parseInt(qtyInput.value, 10);
      if (Number.isFinite(n) && n >= 1) qty = n;
    });

    // khi blur thì auto clamp về >= 1
    qtyInput?.addEventListener("blur", () => {
      let n = parseInt(qtyInput.value, 10);
      if (!Number.isFinite(n) || n < 1) n = 1;
      qty = n;
      qtyInput.value = String(qty);
    });

    // Add to cart (localStorage)
    root.querySelector("#addCart").addEventListener("click", () => {
      const pickedColor = product.colors?.[colorIndex]?.label ?? null;

      const item = {
        id: product.id,
        name: product.name,
        price: product.price,
        oldPrice: product.oldPrice ?? null,  // thêm để tính discount ở cart
        image: product.image,
        color: pickedColor,
        size: sizeValue,
        qty
      };

      const cart = JSON.parse(localStorage.getItem("CART") || "[]");

      // gộp nếu trùng biến thể (id + color + size)
      const idx = cart.findIndex(x =>
        x.id === item.id &&
        x.color === item.color &&
        x.size === item.size
      );

      if (idx >= 0) {
        cart[idx].qty += item.qty;
      } else {
        cart.push(item);
      }
      localStorage.setItem("CART", JSON.stringify(cart));

      alert("Added to cart!");
    });
  }

  render();

  let related = PRODUCTS.filter(p => p.id !== product.id)
    .filter(p => p.category === product.category)
    .slice(0, 4);

  renderProducts(related, "relatedProducts");

  const tabs = document.querySelectorAll(".tab-link");
  const pane = document.querySelectorAll(".tab-pane");


  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const target = tab.dataset.tab;

      e.preventDefault();
      tabs.forEach(t => t.classList.remove("active"));
      pane.forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.querySelector(`.tab-pane[data-tab="${target}"]`).classList.add("active");
    });
  });

  const detailPane = document.querySelector(
    '.tab-pane[data-tab="Detail"]'
  );
  renderProductDetail(detailPane, product.detail);

  const ratingPane = document.querySelector(
    '.tab-pane[data-tab="Review"]'
  );
  /* ===============================
 * 3) ĐẢM BẢO REVIEWS ĐÃ INIT
 * reviews.js có auto-init, nhưng phòng khi thứ tự load sai
 * =============================== */
  if (typeof getReviewsByProductId !== "function" || typeof getReviewStats !== "function") {
    console.error("[review] review helpers not found. Check script order.");
    return;
  }

  // Nếu REVIEWS rỗng vì PRODUCTS chưa có lúc reviews.js chạy
  // thì gọi lại initReviews()
  if (Array.isArray(window.REVIEWS) && window.REVIEWS.length === 0 && typeof initReviews === "function") {
    initReviews(20260129);
  }

  /* ===============================
   * 4) LẤY DATA REVIEW + STATS
   * =============================== */
  const sort = "newest"; // "helpful" hoặc "newest"
  const reviews = getReviewsByProductId(id, { sort });
  const stats = getReviewStats(id);

  console.log("[review] stats:", stats);
  console.log("[review] reviews:", reviews);

  /* ===============================
   * 5) RENDER UI VÀO REVIEW PANE
   * =============================== */
  renderReviews(ratingPane, reviews, stats);
});

function renderProductDetail(container, detail) {

  // 4.1 Render FEATURES list
  const featuresHTML = Array.isArray(detail.features)
    ? detail.features.map(item => `<li>${item}</li>`).join("")
    : "";

  // 4.2 Render CARE list
  const careHTML = Array.isArray(detail.care)
    ? detail.care.map(item => `<li>${item}</li>`).join("")
    : "";

  // 4.3 Build toàn bộ HTML cho tab Detail
  const html = `
    <div class="product-detail-content">

      <h3>Product Description</h3>
      <p>${detail.intro || ""}</p>

      <h4>Specifications</h4>
      <ul>
        ${detail.material ? `<li><strong>Material:</strong> ${detail.material}</li>` : ""}
        ${detail.fit ? `<li><strong>Fit:</strong> ${detail.fit}</li>` : ""}
      </ul>

      ${featuresHTML ? `
        <h4>Features</h4>
        <ul>${featuresHTML}</ul>
      ` : ""}

      ${careHTML ? `
        <h4>Care Instructions</h4>
        <ul>${careHTML}</ul>
      ` : ""}

    </div>
  `;

  // 4.4 Gắn HTML vào DOM
  container.innerHTML = html;
}

/* =================================================
 * renderReviews(container, reviews, stats)
 * - build HTML header + list cards
 * ================================================= */
function renderReviews(container, reviews, stats) {
  const count = stats.count;
  const avg = stats.avg;

  // build stars string đơn giản
  const avgStars = renderStars(Math.round(avg));

  // List card html
  const listHtml = reviews.map(r => {
    const stars = renderStars(r.rating);
    const variant = r.variant ? `<span class="variant">${r.variant.color} • ${r.variant.size}</span>` : "";

    return `
      <article class="review-card">
        <div class="review-card-top">
          <div class="stars">${stars}</div>
          <button class="review-more" type="button" aria-label="More options">…</button>
        </div>

        <div class="review-meta">
          <strong class="review-author">${r.author}</strong>
          ${variant}
        </div>

        <h4 class="review-title">${escapeHtml(r.title)}</h4>
        <p class="review-body">${escapeHtml(r.body)}</p>

        <div class="review-footer">
          <span class="review-date">Posted on ${r.date}</span>
          <span class="review-helpful">Helpful (${r.helpfulCount})</span>
        </div>
      </article>
    `;
  }).join("");

  // Nếu chưa có review
  const emptyHtml = `<p class="review-empty">No reviews for this product yet.</p>`;

  // Render full pane (header + list)
  container.innerHTML = `
    <div class="review-header">
      <div>
        <h3>All Reviews (${count})</h3>
        <div class="review-avg">
          <span class="avg-stars">${avgStars}</span>
          <span class="avg-number">${avg.toFixed(1)} / 5</span>
        </div>
      </div>

      <div class="review-actions">
        <!-- Bạn có thể nối sort UI thật của bạn vào đây -->
        <button type="button" class="btn-write-review">Write a Review</button>
      </div>
    </div>

    <div class="review-grid">
      ${count ? listHtml : emptyHtml}
    </div>
  `;
}

/* ===== Helpers nhỏ ===== */

// render ★★★★★ theo rating 1..5
function renderStars(n) {
  const full = "★".repeat(Math.max(0, Math.min(5, n)));
  const empty = "☆".repeat(5 - Math.max(0, Math.min(5, n)));
  return full + empty;
}

// tránh XSS khi đổ text vào innerHTML
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
const __galleryTimers = new WeakMap();

function setupGalleryAutoSlide(root, gallery, getActiveIndex, setActiveIndex) {
  const mainWrap = root.querySelector(".pd-main");
  const thumbs = Array.from(root.querySelectorAll(".pd-thumb"));

  if (!mainWrap || thumbs.length <= 1) return;

  // tránh tạo nhiều interval khi render lại
  const old = __galleryTimers.get(root);
  if (old) clearInterval(old);

  const stop = () => {
    const t = __galleryTimers.get(root);
    if (t) clearInterval(t);
    __galleryTimers.delete(root);
  };

  const start = () => {
    stop();
    const timer = setInterval(() => {
      const next = (getActiveIndex() + 1) % gallery.length;
      setActiveIndex(next);
    }, 2500);
    __galleryTimers.set(root, timer);
  };

  // pause hover ảnh lớn
  mainWrap.addEventListener("mouseenter", stop);
  mainWrap.addEventListener("mouseleave", start);

  // click thumb -> đổi ảnh + reset timer
  thumbs.forEach((btn, idx) => {
    btn.addEventListener("click", () => {
      setActiveIndex(idx);
      start();
    });
  });

  start();
}
