document.addEventListener("DOMContentLoaded", () => {
  // 🔧 Đổi selector nếu project bạn khác
  const sticky = document.querySelector(".banner-pin");
  const footer = document.querySelector(".footer"); // hoặc "#footer"

  const bottom = 0; // phải khớp CSS bottom khi fixed
  const gap = 24;    // khoảng cách muốn chừa trước footer

  if (!sticky || !footer) return;

  // Placeholder để layout không bị "nhảy" khi sticky chuyển fixed <-> static
  const placeholder = document.createElement("div");
  placeholder.style.height = "0px";
  sticky.insertAdjacentElement("afterend", placeholder);

  function setFixed(on) {
    if (on) {
      sticky.style.position = "fixed";
      sticky.style.left = "50%";
      sticky.style.bottom = `${bottom}px`;
      sticky.style.zIndex = "999";

      // ✅ Fixed mode dùng transform như bạn đang có
      sticky.style.transform = "translateX(-50%) translateY(var(--lift, 0px))";

      // giữ chỗ để footer không bị giật lên
      placeholder.style.height = `${sticky.offsetHeight + gap}px`;
    } else {
      // ✅ BỎ position: fixed và BỎ transform theo đúng yêu cầu
      sticky.style.position = "static";
      sticky.style.left = "";
      sticky.style.bottom = "";
      sticky.style.zIndex = "";
      sticky.style.transform = "none";

      placeholder.style.height = "0px";
    }
  }

  function update() {
    if (window.innerWidth <= 1024) {
      setFixed(false);
      return;
    }
    const stickyH = sticky.offsetHeight;
    const footerTop = footer.getBoundingClientRect().top;

    // Khi footer tiến vào vùng đáy nơi sticky đang fixed -> bỏ fixed
    const threshold = window.innerHeight - bottom - stickyH - gap;

    if (footerTop <= threshold) setFixed(false);
    else setFixed(true);
  }

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
});
