function readCart() {
    return JSON.parse(localStorage.getItem("CART") || "[]");
}

function saveCart(cart) {
    localStorage.setItem("CART", JSON.stringify(cart));
}

function money(n) {
    const x = Number(n || 0);
    return `$${x.toFixed(2)}`;
}

function calcSummary(cart) {
    const subtotal = cart.reduce((s, it) => s + (it.price * it.qty), 0);

    // discount: nếu có oldPrice thì discount = (oldPrice - price) * qty
    const discount = cart.reduce((s, it) => {
        const oldP = Number(it.oldPrice || 0);
        const p = Number(it.price || 0);
        if (!oldP || oldP <= p) return s;
        return s + (oldP - p) * it.qty;
    }, 0);

    // tuỳ bạn: fee cố định hoặc 0
    const delivery = cart.length ? 0 : 0;

    const total = subtotal - discount + delivery;
    return { subtotal, discount, delivery, total };
}

function renderCart() {
    const cartItemsEl = document.getElementById("cartItems");
    const cart = readCart();

    if (!cartItemsEl) return;

    if (cart.length === 0) {
        cartItemsEl.innerHTML = `<p style="padding:16px;">Your cart is empty.</p>`;
        renderSummary(cart);
        return;
    }

    cartItemsEl.innerHTML = cart.map((it, index) => {
        const variant = [it.color, it.size].filter(Boolean).join(" / ");
        return `
      <article class="cart-item" data-index="${index}">
        <div class="cart-thumbnail">
          <img src="${it.image}" alt="${it.name}">
        </div>

        <div class="cart-info">
          <h3 class="cart-product-name">${it.name}</h3>
          <p class="cart-product-sku">${variant ? `Variant: ${variant}` : ""}</p>
          <p class="cart-product-price">${money(it.price)}</p>
        </div>

        <div class="cart-button">
          <div class="pd-actions">
            <button class="remove-button" type="button" data-action="remove" aria-label="Remove">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                    fill="currentColor" class="icon">
                    <path fill-rule="evenodd"
                    d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                    clip-rule="evenodd" />
                </svg>
            </button>

            <div class="qty">
              <button type="button" data-action="minus">−</button>
              <span class="qty-display">${it.qty}</span>
              <button type="button" data-action="plus">+</button>
            </div>
          </div>
        </div>
      </article>
    `;
    }).join("");

    // Event delegation cho remove / plus / minus
    cartItemsEl.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const itemEl = e.target.closest(".cart-item");
        if (!itemEl) return;

        const index = Number(itemEl.dataset.index);
        const action = btn.dataset.action;

        const cart = readCart();
        if (!cart[index]) return;

        if (action === "remove") {
            cart.splice(index, 1);
            saveCart(cart);
            renderCart();
            return;
        }

        if (action === "plus") {
            cart[index].qty += 1;
            saveCart(cart);
            renderCart();
            return;
        }

        if (action === "minus") {
            cart[index].qty = Math.max(1, cart[index].qty - 1);
            saveCart(cart);
            renderCart();
            return;
        }
    }, { once: true }); // tránh add listener chồng khi render lại

    renderSummary(cart);
}

function renderSummary(cart) {
    const { subtotal, discount, delivery, total } = calcSummary(cart);

    const elSubtotal = document.getElementById("sumSubtotal");
    const elDiscount = document.getElementById("sumDiscount");
    const elDelivery = document.getElementById("sumDelivery");
    const elTotal = document.getElementById("sumTotal");

    if (elSubtotal) elSubtotal.textContent = money(subtotal);
    if (elDiscount) elDiscount.textContent = money(discount);
    if (elDelivery) elDelivery.textContent = money(delivery);
    if (elTotal) elTotal.textContent = money(total);
}

document.addEventListener("DOMContentLoaded", () => {
    renderCart();
});
