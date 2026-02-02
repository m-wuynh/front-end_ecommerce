// homejs/header.js
document.addEventListener("DOMContentLoaded", () => {
    // ========== 1) Close announcement bar ==========
    const announcementBar = document.querySelector(".announcement-bar");
    const announcementCloseBtn = document.querySelector(".announcement-bar-close");

    if (announcementBar && announcementCloseBtn) {
        announcementCloseBtn.addEventListener("click", () => {
            announcementBar.style.display = "none";
        });
    }

    // ========== 2) Mobile search toggle (<768px) ==========
    const searchWrap = document.querySelector(".header-main .search");
    const searchToggle = document.querySelector(".header-main .search-toggle");
    const searchInput = document.querySelector(".header-main .search input");

    const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

    const openSearch = () => {
        if (!searchWrap || !searchToggle || !searchInput) return;
        searchWrap.classList.add("is-open");
        searchToggle.setAttribute("aria-expanded", "true");

        // Focus để user gõ luôn
        searchInput.focus();
    };

    const closeSearch = () => {
        if (!searchWrap || !searchToggle) return;
        searchWrap.classList.remove("is-open");
        searchToggle.setAttribute("aria-expanded", "false");
    };

    if (searchToggle && searchWrap && searchInput) {
        searchToggle.addEventListener("click", (e) => {
            if (!isMobile()) return; // desktop thì khỏi toggle, input vốn đang hiện
            e.stopPropagation();

            const isOpen = searchWrap.classList.contains("is-open");
            if (isOpen) closeSearch();
            else openSearch();
        });

        // Click ra ngoài thì đóng (mobile)
        document.addEventListener("click", (e) => {
            if (!isMobile()) return;
            if (!searchWrap.contains(e.target)) closeSearch();
        });

        // Nhấn ESC để đóng
        document.addEventListener("keydown", (e) => {
            if (!isMobile()) return;
            if (e.key === "Escape") closeSearch();
        });

        // Khi resize từ mobile -> desktop thì reset trạng thái
        window.addEventListener("resize", () => {
            if (!isMobile()) closeSearch();
        });
    }
    // ========== 3) Hamburger menu (mobile drawer) ==========
    const menuBtn = document.querySelector(".header-main .menu-toggle");
    const nav = document.querySelector(".header-main nav.nav-header");

    const backdrop = document.createElement("div");
    backdrop.className = "menu-backdrop";
    document.body.appendChild(backdrop);

    const openMenu = () => {
        if (!isMobile()) return;
        document.body.classList.add("menu-open");
        menuBtn?.setAttribute("aria-expanded", "true");
    };

    const closeMenu = () => {
        document.body.classList.remove("menu-open");
        menuBtn?.setAttribute("aria-expanded", "false");
    };

    if (menuBtn && nav) {
        // đảm bảo aria cho đúng chuẩn
        menuBtn.setAttribute("aria-controls", "main-nav");
        menuBtn.setAttribute("aria-expanded", "false");
        nav.id = "main-nav";

        menuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!isMobile()) return;

            document.body.classList.contains("menu-open") ? closeMenu() : openMenu();
        });

        // bấm nền tối để đóng
        backdrop.addEventListener("click", closeMenu);

        // nhấn ESC để đóng
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeMenu();
        });

        // khi resize lên desktop thì đóng menu
        window.addEventListener("resize", () => {
            if (!isMobile()) closeMenu();
        });

        // (optional) bấm vào link trong menu thì tự đóng (đỡ khó chịu trên mobile)
        nav.addEventListener("click", (e) => {
            const target = e.target;
            if (target && (target.tagName === "A")) closeMenu();
        });
    }
    // ========== 4) Shop dropdown: mobile click (desktop dùng hover CSS) ==========
    const shopLi = document.querySelector(".header-main nav.nav-header .shop-menu");
    const shopBtn = document.querySelector(".header-main nav.nav-header .shop-menu-btn");

    const closeShopMobile = () => {
        if (!shopLi || !shopBtn) return;
        shopLi.classList.remove("is-open");
        shopBtn.setAttribute("aria-expanded", "false");
    };

    if (shopLi && shopBtn) {
        shopBtn.addEventListener("click", (e) => {
            // Desktop không cần click (đã hover), nên chặn chỉ chạy trên mobile
            if (!isMobile()) return;

            e.preventDefault();
            e.stopPropagation();

            const willOpen = !shopLi.classList.contains("is-open");
            shopLi.classList.toggle("is-open", willOpen);
            shopBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
        });

        // Bấm ra ngoài (trong mobile) thì đóng dropdown
        document.addEventListener("click", (e) => {
            if (!isMobile()) return;
            if (!shopLi.contains(e.target)) closeShopMobile();
        });

        // Nhấn ESC thì đóng
        document.addEventListener("keydown", (e) => {
            if (!isMobile()) return;
            if (e.key === "Escape") closeShopMobile();
        });
    }

    // ========== 5) Search by name + Suggest + Submit to search.html ==========
    const searchForm = document.querySelector(".header-main .search .search-form");
    const searchInputEl = document.querySelector("#headerSearchInput");
    const suggestBox = document.querySelector("#searchSuggest");

    // Yêu cầu: PRODUCTS phải là mảng global (từ allproduct.js)
    const getProductsSafe = () => {
        // ưu tiên window.PRODUCTS (đã fix ở allproduct.js)
        if (Array.isArray(window.PRODUCTS)) return window.PRODUCTS;

        // fallback: nếu script vẫn tạo biến global PRODUCTS (hiếm khi dùng const)
        try {
            if (typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS)) return PRODUCTS;
        } catch (_) { }

        return [];
    };


    const normalize = (s) =>
        (s ?? "")
            .toString()
            .trim()
            .toLowerCase();

    // highlight keyword trong tên (nhẹ nhàng thôi)
    const highlight = (text, kw) => {
        const t = text || "";
        if (!kw) return t;
        const idx = t.toLowerCase().indexOf(kw.toLowerCase());
        if (idx < 0) return t;
        const a = t.slice(0, idx);
        const b = t.slice(idx, idx + kw.length);
        const c = t.slice(idx + kw.length);
        return `${a}<mark>${b}</mark>${c}`;
    };

    const hideSuggest = () => {
        if (!suggestBox) return;
        suggestBox.hidden = true;
        suggestBox.innerHTML = "";
    };

    const showSuggest = (items, kw) => {
        if (!suggestBox) return;

        if (!items.length) {
            suggestBox.innerHTML = `
      <div class="suggest-item" style="cursor:default;">
        <div class="suggest-name">No products found for "<b>${kw}</b>"</div>
      </div>
    `;
            suggestBox.hidden = false;
            return;
        }

        suggestBox.innerHTML = items
            .map((p) => {
                const name = p?.name || "Unnamed product";
                const img = p?.image || "";
                const price = (p?.price != null) ? `$${Number(p.price).toFixed(0)}` : "";
                return `
        <div class="suggest-item" data-name="${encodeURIComponent(name)}">
          ${img ? `<img class="suggest-thumb" src="${img}" alt="">` : `<div class="suggest-thumb"></div>`}
          <div>
            <div class="suggest-name">${highlight(name, kw)}</div>
            <div class="suggest-meta">${price}</div>
          </div>
        </div>
      `;
            })
            .join("");

        suggestBox.hidden = false;
    };

    // Filter theo name (contains)
    const searchByName = (kw) => {
        const q = normalize(kw);
        if (!q) return [];
        return getProductsSafe().filter(p => normalize(p?.name).includes(q));
    };

    // Input → suggest
    if (searchInputEl && suggestBox) {
        let lastKw = "";

        searchInputEl.addEventListener("input", () => {
            const kw = normalize(searchInputEl.value);
            lastKw = kw;

            if (kw.length < 2) {   // gõ <2 ký tự thì không hiện gợi ý
                hideSuggest();
                return;
            }

            const results = searchByName(kw).slice(0, 6); // top 6 gợi ý
            showSuggest(results, kw);
        });

        // Click gợi ý: đi thẳng sang trang search với keyword đó
        suggestBox.addEventListener("click", (e) => {
            const item = e.target.closest(".suggest-item");
            if (!item) return;

            const encodedName = item.getAttribute("data-name");
            if (!encodedName) return;

            const name = decodeURIComponent(encodedName);
            searchInputEl.value = name;
            hideSuggest();

            // submit form để ra list kết quả
            if (searchForm) searchForm.requestSubmit?.();
            else window.location.href = `search.html?q=${encodeURIComponent(name)}`;
        });

        // Click ra ngoài thì tắt suggest
        document.addEventListener("click", (e) => {
            const wrap = document.querySelector(".header-main .search");
            if (!wrap) return;
            if (!wrap.contains(e.target)) hideSuggest();
        });

        // ESC tắt suggest
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") hideSuggest();
        });
    }

    // Submit: luôn đưa q lên URL search.html?q=...
    if (searchForm && searchInputEl) {
        searchForm.addEventListener("submit", (e) => {
            const kw = normalize(searchInputEl.value);
            if (!kw) {
                e.preventDefault();
                hideSuggest();
                return;
            }
            hideSuggest();
            // mặc định form GET đã tự chuyển qua search.html?q=...
        });
    }

});
