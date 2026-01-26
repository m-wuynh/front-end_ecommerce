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


});
