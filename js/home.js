// js/home.js
// Trang HOME chỉ hiện 4 sản phẩm đầu tiên

document.addEventListener("DOMContentLoaded", () => {
  const first4 = PRODUCTS.slice(0, 4);
  renderProducts(first4, "grid_new_arrivals");
});
document.addEventListener("DOMContentLoaded", () => {
  const first4 = PRODUCTS.slice(4, 8);
  renderProducts(first4, "grid_best_sellers");
});
