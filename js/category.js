const currentURL = new URL(window.location.href);
const categoryID = currentURL.searchParams.getAll("category");
const tag = currentURL.searchParams.getAll("tag");
const breadcrumbCurrent = document.querySelectorAll(".breadcrumb-current");

if (tag.length > 0 || categoryID) {
    // Cập nhật breadcrumb
    breadcrumbCurrent.forEach(element => {
        element.textContent = `${categoryID}` || `${tag}`;
    });
}


// Khởi tạo noUiSlider cho bộ lọc giá
var slider = document.getElementById('slider');

noUiSlider.create(slider, {
    start: [20, 80],
    connect: true,
    range: {
        'min': 0,
        'max': 100
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);

    // Hỗ trợ nhiều kiểu URL:
    // category.html?category=jeans
    // category.html?category=jeans&tag=casual
    // category.html?tag=on-sale
    const categoryParam = params.get("category") || params.get("id"); // nếu bạn từng dùng id
    const tags = params.getAll("tag"); // tag=casual&tag=new

    // normalize để tránh lệch chữ hoa/thường
    const norm = (s) => (s ?? "").trim().toLowerCase();

    const category = categoryParam ? norm(categoryParam) : null;
    const wantedTags = [...new Set(tags.map(norm).filter(Boolean))];
    let list = PRODUCTS;
    const hasCategory = !!category;
    const hasTags = wantedTags.length > 0;

    if (hasCategory || hasTags) {
        list = PRODUCTS.filter(p => {
            const okCategory = hasCategory && norm(p.category) === category;
            const productTags = (p.tag || []).map(norm);
            const okTags = hasTags && wantedTags.every(t => productTags.includes(t));
            return okCategory || okTags; // OR
        });
    }
    renderProducts(list.slice(0, 9), "grid_category");
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
