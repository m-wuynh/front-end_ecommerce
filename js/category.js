document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  // category.html?category=jeans
  // category.html?tag=onsale
  // category.html?q=hoodie
  // category.html?q=hoodie&page=2
  const categoryParam = params.get("category") || params.get("id");
  const tags = params.getAll("tag");
  const qRaw = params.get("q") || "";
  const q = qRaw.trim().toLowerCase();

  const pageParam = parseInt(params.get("page") || "1", 10);
  let currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const PER_PAGE = 9;

  const norm = (s) => (s ?? "").toString().trim().toLowerCase();

  const category = categoryParam ? norm(categoryParam) : null;
  const wantedTags = [...new Set(tags.map(norm).filter(Boolean))];

  // đảm bảo lấy được PRODUCTS
  const products = Array.isArray(window.PRODUCTS)
    ? window.PRODUCTS
    : (typeof PRODUCTS !== "undefined" ? PRODUCTS : []);

  const hasCategory = !!category;
  const hasTags = wantedTags.length > 0;
  const hasQuery = q.length > 0;

  // ===== 1) FILTER LIST =====
  let list = products;

  // Ưu tiên search theo tên nếu có q
  if (hasQuery) {
    list = products.filter(p => norm(p?.name).includes(q));
  } else if (hasCategory || hasTags) {
    list = products.filter(p => {
      const okCategory = hasCategory && norm(p.category) === category;
      const productTags = (p.tag || []).map(norm);
      const okTags = hasTags && wantedTags.every(t => productTags.includes(t));
      return okCategory || okTags; // OR
    });
  }

  // ===== 2) UPDATE TITLE / BREADCRUMB =====
  const breadcrumbCurrent = document.querySelectorAll(".breadcrumb-current");
  breadcrumbCurrent.forEach(el => {
    if (hasQuery) el.textContent = `${qRaw}`;
    else if (hasCategory) el.textContent = categoryParam;
    else if (hasTags) el.textContent = wantedTags.join(", ");
    else el.textContent = "Category";
  });

  // ===== 3) PAGINATION RENDER =====
  const pager = document.querySelector(".plp-pagination");
  const prevBtn = pager?.querySelector(".prev-page");
  const nextBtn = pager?.querySelector(".next-page");
  const pagesUl = pager?.querySelector("ul");

  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PER_PAGE));

  // clamp currentPage
  if (currentPage > totalPages) currentPage = totalPages;

  const buildUrlWithPage = (page) => {
    const u = new URL(window.location.href);
    u.searchParams.set("page", String(page));
    return u.toString();
  };

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

    // update UI trạng thái nút
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

    // highlight số trang
    if (pagesUl) {
      [...pagesUl.querySelectorAll("button[data-page]")].forEach(btn => {
        const p = parseInt(btn.dataset.page, 10);
        btn.classList.toggle("is-active", p === currentPage);
        btn.setAttribute("aria-current", p === currentPage ? "page" : "false");
      });
    }

    // giữ page trên URL để refresh không bị về trang 1
    syncUrl(currentPage);

    // (tuỳ chọn) auto scroll lên top grid cho UX tốt hơn
    document.getElementById("grid_category")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderPagerButtons = () => {
    if (!pagesUl) return;

    // nếu bạn muốn kiểu 1 2 3 ... 10, mình làm bản gọn dưới đây
    // hiển thị tối đa 7 nút: 1 ... (x-1) x (x+1) ... last
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

    // bind click
    pagesUl.querySelectorAll("button[data-page]").forEach(b => {
      b.addEventListener("click", () => renderPage(parseInt(b.dataset.page, 10)));
    });
  };

  // bind prev/next
  prevBtn?.addEventListener("click", () => {
    if (currentPage > 1) renderPage(currentPage - 1);
  });

  nextBtn?.addEventListener("click", () => {
    if (currentPage < totalPages) renderPage(currentPage + 1);
  });

  // init
  renderPagerButtons();
  renderPage(currentPage);
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

    // Safety: if user rotates / resizes to desktop, close drawer
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) close();
    });
});
