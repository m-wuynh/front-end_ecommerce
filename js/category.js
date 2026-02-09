document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const norm = (s) => (s ?? "").toString().trim().toLowerCase();

  // ===== 기존 params =====
  const pickedCategories = params.getAll("category").map(norm).filter(Boolean);
  const tags = params.getAll("tag");
  const qRaw = params.get("q") || "";
  const q = qRaw.trim().toLowerCase();
  const sortBy = params.get("sort") || "popular";


  const pageParam = parseInt(params.get("page") || "1", 10);
  let currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const PER_PAGE = 12;

  const legacyCategory = norm(params.get("id") || "");
  if (!pickedCategories.length && legacyCategory) pickedCategories.push(legacyCategory);
  const wantedTags = [...new Set(tags.map(norm).filter(Boolean))];

  // đảm bảo lấy được PRODUCTS
  const products = Array.isArray(window.PRODUCTS)
    ? window.PRODUCTS
    : (typeof PRODUCTS !== "undefined" ? PRODUCTS : []);

  const hasCategory = pickedCategories.length > 0;
  const hasTags = wantedTags.length > 0;
  const hasQuery = q.length > 0;

  // ===== helpers: price / attribute getters (tự chịu được nhiều kiểu data) =====
  const getPriceNumber = (p) => {
    const raw =
      p?.price ??
      p?.priceCurrent ??
      p?.currentPrice ??
      p?.price_current ??
      p?.amount ??
      0;

    // nếu là string kiểu "$120" -> lấy số
    if (typeof raw === "string") {
      const n = parseFloat(raw.replace(/[^\d.]/g, ""));
      return Number.isFinite(n) ? n : 0;
    }
    return Number.isFinite(raw) ? raw : 0;
  };

  const getColors = (p) => {
    // allproduct.js: colors = [{label, hex}, ...]
    const arr = Array.isArray(p?.colors) ? p.colors : [];
    return arr.map(c => norm(c?.label)).filter(Boolean); // ["black","white"...]
  };


  const getSizes = (p) => {
    const arr = Array.isArray(p?.sizes) ? p.sizes : [];
    return arr.map(s => (s ?? "").toString().trim()); // giữ nguyên "XS","28"
  };

  const getStyles = (p) => {
    // nhiều bạn lưu style vào tag, nên mình ưu tiên tag
    const tagArr = Array.isArray(p?.tag) ? p.tag : [];
    const styleArr = Array.isArray(p?.styles) ? p.styles : (p?.style ? [p.style] : []);
    return [...tagArr, ...styleArr].map(norm).filter(Boolean);
  };

  // ===== 1) BASE FILTER: category/tag/q =====
  let list = products;

  if (hasQuery) {
    list = products.filter(p => norm(p?.name).includes(q));
  } else if (hasCategory || hasTags) {
    list = products.filter(p => {
      const okCategory = hasCategory && pickedCategories.includes(norm(p.category));
      const productTags = (p.tag || []).map(norm);
      const okTags = hasTags && wantedTags.some(t => productTags.includes(t));
      return okCategory || okTags; // OR (như bạn đang làm)
    });
  }

  const isEmptySearch = hasQuery && list.length === 0;

  // ===== 2) FACET FILTER: price/color/size/style từ URL =====
  const minParam = parseFloat(params.get("min") || "");
  const maxParam = parseFloat(params.get("max") || "");
  const minPrice = Number.isFinite(minParam) ? minParam : null;
  const maxPrice = Number.isFinite(maxParam) ? maxParam : null;

  const pickedColors = params.getAll("color").map(norm).filter(Boolean);
  const pickedSizes = params.getAll("size")
    .map(s => (s ?? "").toString().trim())
    .filter(Boolean);

  const pickedStyles = params.getAll("tag").map(norm).filter(Boolean);

  const hasMin = minPrice !== null;
  const hasMax = maxPrice !== null;

  if (hasMin || hasMax || pickedColors.length || pickedSizes.length || pickedStyles.length) {
    list = list.filter(p => {
      const price = getPriceNumber(p);

      if (hasMin && price < minPrice) return false;
      if (hasMax && price > maxPrice) return false;

      if (pickedColors.length) {
        const pc = getColors(p);
        const ok = pickedColors.some(c => pc.includes(c));
        if (!ok) return false;
      }

      if (pickedSizes.length) {
        const ps = getSizes(p);
        const ok = pickedSizes.some(s => ps.includes(s));
        if (!ok) return false;
      }

      if (pickedStyles.length) {
        const pst = getStyles(p);
        const ok = pickedStyles.some(st => pst.includes(st));
        if (!ok) return false;
      }

      return true;
    });
  }

  // ===== 3) UPDATE TITLE / BREADCRUMB =====
  const breadcrumbCurrent = document.querySelectorAll(".breadcrumb-current");
  breadcrumbCurrent.forEach(el => {
    if (hasQuery) el.textContent = `${qRaw}`;
    else if (hasCategory) el.textContent = pickedCategories.join(", ");
    else if (hasTags) el.textContent = wantedTags.join(", ");
    else el.textContent = "Category";
  });


  // ===== SORT =====
  if (sortBy === "price-asc") {
    list.sort((a, b) => getPriceNumber(a) - getPriceNumber(b));
  }

  if (sortBy === "price-desc") {
    list.sort((a, b) => getPriceNumber(b) - getPriceNumber(a));
  }
  const sortSelect = document.getElementById("sortBy");
  if (sortSelect) {
    sortSelect.value = sortBy;
  }
  sortSelect?.addEventListener("change", () => {
    const u = new URL(window.location.href);

    u.searchParams.set("sort", sortSelect.value);
    u.searchParams.set("page", "1"); // đổi sort thì về page 1

    window.location.href = u.toString();
  });

  const noResultText = document.getElementById("noResultText");

  if (isEmptySearch && noResultText) {
    noResultText.style.display = "flex";
  }

  // ===== 4) PAGINATION RENDER =====
  const pager = document.querySelector(".plp-pagination");
  if (isEmptySearch && pager) {
    pager.style.display = "none";
  }
  const prevBtn = pager?.querySelector(".prev-page");
  const nextBtn = pager?.querySelector(".next-page");
  const pagesUl = pager?.querySelector("ul");

  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;

  const syncUrl = (page) => {
    const u = new URL(window.location.href);
    u.searchParams.set("page", String(page));
    history.replaceState({}, "", u.toString());
  };

  const renderPage = (page) => {
    currentPage = page;

    const start = (currentPage - 1) * PER_PAGE;
    const end = start + PER_PAGE;
    const pageItems = list.slice(start, end);

    renderProducts(pageItems, "grid_category");

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

    if (pagesUl) {
      [...pagesUl.querySelectorAll("button[data-page]")].forEach(btn => {
        const p = parseInt(btn.dataset.page, 10);
        btn.classList.toggle("is-active", p === currentPage);
        btn.setAttribute("aria-current", p === currentPage ? "page" : "false");
      });
    }

    syncUrl(currentPage);
    document.getElementById("grid_category")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderPagerButtons = () => {
    if (!pagesUl) return;

    const maxVisible = 7;
    const btn = (p) => `<li><button type="button" data-page="${p}">${p}</button></li>`;
    const dots = () => `<li><span style="opacity:.6;padding:0 6px;">...</span></li>`;

    let html = "";

    if (totalPages <= maxVisible) {
      for (let p = 1; p <= totalPages; p++) html += btn(p);
    } else {
      const left = Math.max(2, currentPage - 1);
      const right = Math.min(totalPages - 1, currentPage + 1);

      html += btn(1);
      if (left > 2) html += dots();
      for (let p = left; p <= right; p++) html += btn(p);
      if (right < totalPages - 1) html += dots();
      html += btn(totalPages);
    }

    pagesUl.innerHTML = html;

    pagesUl.querySelectorAll("button[data-page]").forEach(b => {
      b.addEventListener("click", () => renderPage(parseInt(b.dataset.page, 10)));
    });
  };

  prevBtn?.addEventListener("click", () => {
    if (currentPage > 1) renderPage(currentPage - 1);
  });
  nextBtn?.addEventListener("click", () => {
    if (currentPage < totalPages) renderPage(currentPage + 1);
  });

  renderPagerButtons();
  renderPage(currentPage);

  // ===== 5) INIT UI: tick checkbox theo URL (để refresh không mất state) =====
  pickedCategories.forEach(c => {
    document.querySelectorAll(`.size-input[data-category="${c}"]`).forEach(el => el.checked = true);
  });

  pickedColors.forEach(c => {
    document.querySelectorAll(`.color-input[data-color="${c}"]`).forEach(el => el.checked = true);
  });

  pickedSizes.forEach(s => {
    document.querySelectorAll(`.size-input[data-size="${s}"]`).forEach(el => el.checked = true);
  });

  pickedStyles.forEach(st => {
    document.querySelectorAll(`.size-input[data-style="${st}"]`).forEach(el => el.checked = true);
  });

  // ===== 6) PRICE SLIDER: tạo slider + set theo URL =====
  const sliderEl = document.getElementById("slider");
  if (sliderEl && window.noUiSlider) {
    // lấy min/max hợp lý từ products (base list) để slider không bị vô nghĩa
    const prices = products.map(getPriceNumber).filter(n => Number.isFinite(n) && n > 0);
    const minAll = prices.length ? Math.min(...prices) : 0;
    const maxAll = prices.length ? Math.max(...prices) : 500;

    // nếu đã có slider rồi thì bỏ qua
    if (!sliderEl.noUiSlider) {
      noUiSlider.create(sliderEl, {
        start: [
          minPrice !== null ? minPrice : minAll,
          maxPrice !== null ? maxPrice : maxAll
        ],
        connect: true,
        step: 1,
        range: { min: minAll, max: maxAll },
      });
    } else {
      sliderEl.noUiSlider.set([
        minPrice !== null ? minPrice : minAll,
        maxPrice !== null ? maxPrice : maxAll
      ]);
    }
    const minText = document.getElementById("priceMinText");
    const maxText = document.getElementById("priceMaxText");

    const fmt = (n) => `$${Math.round(n)}`;

    if (sliderEl?.noUiSlider && minText && maxText) {
      // set lần đầu
      const [a0, b0] = sliderEl.noUiSlider.get().map(v => parseFloat(v));
      minText.textContent = fmt(a0);
      maxText.textContent = fmt(b0);

      // update realtime khi kéo
      sliderEl.noUiSlider.on("update", (values) => {
        const a = parseFloat(values[0]);
        const b = parseFloat(values[1]);
        minText.textContent = fmt(a);
        maxText.textContent = fmt(b);
      });
    }

  }

  // ===== 7) APPLY BUTTON: đọc UI -> update URL -> reload =====
  const btnApply = document.getElementById("btnApplyFilter");

  btnApply?.addEventListener("click", () => {
    // URL mới tinh (không lấy params cũ)
    const newParams = new URLSearchParams();

    // ===== PRICE =====
    const sliderEl = document.getElementById("slider");
    if (sliderEl?.noUiSlider) {
      const [a, b] = sliderEl.noUiSlider.get().map(v => Math.round(parseFloat(v)));
      newParams.set("min", String(a));
      newParams.set("max", String(b));
    }

    // ===== COLORS (multi) =====
    document.querySelectorAll(".color-input:checked").forEach(el => {
      const c = (el.getAttribute("data-color") ?? "").toString().trim().toLowerCase();
      if (c) newParams.append("color", c);
    });

    // ===== SIZES (multi) =====
    // Lưu ý: size của bạn là "XS" "S" "M"... => KHÔNG lowercase
    document.querySelectorAll('.size-input:checked[data-size]').forEach(el => {
      const s = (el.getAttribute("data-size") ?? "").toString().trim();
      if (s) newParams.append("size", s);
    });

    // ===== CATEGORIES (multi) =====
    document.querySelectorAll('.size-input:checked[data-category]').forEach(el => {
      const cat = (el.getAttribute("data-category") ?? "").toString().trim().toLowerCase();
      if (cat) newParams.append("category", cat);
    });

    // ===== TAGS (style của bạn là tag) =====
    document.querySelectorAll('.size-input:checked[data-tag]').forEach(el => {
      const t = (el.getAttribute("data-tag") ?? "").toString().trim().toLowerCase();
      if (t) newParams.append("tag", t);
    });

    // ===== SORT =====
    const sortSelect = document.getElementById("sortBy");
    if (sortSelect?.value && sortSelect.value !== "popular") {
      newParams.set("sort", sortSelect.value);
    }

    // page luôn về 1 khi apply
    newParams.set("page", "1");

    // ===== Ghi đè URL (xóa sạch query cũ) =====
    const basePath = window.location.pathname; // vd: /category.html
    const qs = newParams.toString();
    window.location.href = qs ? `${basePath}?${qs}` : basePath;
  });

});


// ===== Mobile filter drawer (bottom sheet) =====
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.filter-toggle');
  const backdrop = document.querySelector('.filter-backdrop');
  const closeBtn = document.querySelector('.filter-close');

  if (!btn || !backdrop) return;

  const open = () => {
    document.body.classList.add('filter-open');
    btn.setAttribute('aria-expanded', 'true');
  };

  const close = () => {
    document.body.classList.remove('filter-open');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', () => {
    const isOpen = document.body.classList.contains('filter-open');
    isOpen ? close() : open();
  });

  backdrop.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) close();
  });

});
