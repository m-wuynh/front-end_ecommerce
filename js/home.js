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
document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector("[data-rating-slider]");
  if (!slider) return;

  const track = slider.querySelector(".rating-track");
  const cards = Array.from(slider.querySelectorAll(".rating-card"));
  const bitsWrap = slider.querySelector(".rating-bits");

  // ✅ Bắt đúng 2 nút trong header OUR HAPPY CUSTOMERS
  const headerButtons = document.querySelectorAll("section.customer-rating .title button");
  const btnPrev = headerButtons[0] || null;
  const btnNext = headerButtons[1] || null;

  if (!track || cards.length <= 1) return;

  let idx = 0;
  let timer = null;

  const perView = () => {
    const w = window.innerWidth;
    if (w <= 768) return 1;
    if (w <= 1024) return 2;
    return 3;
  };

  const maxIdx = () => Math.max(0, cards.length - perView());

  // bước dịch = khoảng cách left giữa card[1] và card[0] (đã gồm gap)
  const stepPx = () => {
    const first = cards[0];
    const second = cards[1];
    if (!first) return 0;
    if (second) return second.offsetLeft - first.offsetLeft;
    return first.getBoundingClientRect().width;
  };

  const buildBits = () => {
    if (!bitsWrap) return;
    bitsWrap.innerHTML = cards
      .map((_, i) => `<button type="button" class="bit" data-bit="${i}" aria-label="Go to card ${i + 1}"></button>`)
      .join("");

    bitsWrap.querySelectorAll(".bit").forEach(b => {
      b.addEventListener("click", () => {
        idx = Math.min(maxIdx(), Math.max(0, Number(b.dataset.bit)));
        go(idx);
        restart();
      });
    });
  };

  const updateBits = () => {
    if (!bitsWrap) return;
    const pv = perView();
    const start = idx;
    const end = idx + pv - 1;

    bitsWrap.querySelectorAll(".bit").forEach(bit => {
      const i = Number(bit.dataset.bit);
      bit.classList.toggle("is-active", i >= start && i <= end);
    });
  };

  const go = (i) => {
    const m = maxIdx();
    idx = Math.min(m, Math.max(0, i));
    track.style.transform = `translateX(-${stepPx() * idx}px)`;
    updateBits();
  };

  const stop = () => { if (timer) clearInterval(timer); timer = null; };
  const start = () => {
    stop();
    timer = setInterval(() => {
      const m = maxIdx();
      go(idx >= m ? 0 : idx + 1); // wrap
    }, 2600);
  };
  const restart = () => { stop(); start(); };

  // ✅ prev/next wrap vòng như bạn muốn
  btnPrev?.addEventListener("click", () => {
    const m = maxIdx();
    go(idx <= 0 ? m : idx - 1);
    restart();
  });
  btnNext?.addEventListener("click", () => {
    const m = maxIdx();
    go(idx >= m ? 0 : idx + 1);
    restart();
  });

  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);

  window.addEventListener("resize", () => {
    idx = Math.min(idx, maxIdx());
    buildBits();
    go(idx);
  });

  buildBits();
  go(0);
  start();
});
