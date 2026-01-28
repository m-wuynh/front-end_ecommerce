// js/render.js
// File này chứa "khuôn" card sản phẩm + hàm render ra HTML

function createStars(rating) {
  // làm đơn giản: rating 4.5 => làm tròn ra 5 sao
  const filled = Math.round(rating);
  const empty = 5 - filled;

  return "★".repeat(filled) + "☆".repeat(empty);
}

function createProductCard(product) {
  // kiểm tra có giảm giá không
  const hasDiscount = product.oldPrice != null && product.oldPrice > product.price;

  // tính % giảm nếu có oldPrice
  const discountPercent = hasDiscount
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return `
  <a class="product-link" href="product_detail.html?id=${product.id}">
    <article class="product-card">
      <div class="product-thumb">
        <img src="${product.image}" alt="${product.name}">
      </div>

      <h3 class="product-name">${product.name}</h3>

      <div class="product-rating">
        <span class="stars">${createStars(product.rating)}</span>
        <span class="rating-text">${product.rating}/5</span>
      </div>

      <div class="product-price">
        <span class="price-current">$${product.price}</span>

        ${
          hasDiscount
            ? `
              <span class="price-old">$${product.oldPrice}</span>
              <span class="discount">-${discountPercent}%</span>
            `
            : ""
        }
      </div>
    </article>
    </a>
  `;
}

function renderProducts(list, containerId) {
  // tìm div chứa grid theo id
  const grid = document.getElementById(containerId);

  if (!grid) {
    console.error(`Không tìm thấy element có id = "${containerId}"`);
    return;
  }

  // biến list product -> list HTML card -> ghép lại
  grid.innerHTML = list.map(createProductCard).join("");
}
