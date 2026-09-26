(() => {
  const config = window.SITE_CONFIG || {};
  const leadName = (config.leadLawyerName || "").trim();
  const qrSrc = (config.wechatQrSrc || "").trim();
  const wechatId = (config.wechatId || "").trim();

  if (leadName) {
    const displayName = leadName.endsWith("律师") ? leadName : `${leadName}律师`;
    document.getElementById("brandName").textContent = displayName;
    document.getElementById("leadLawyerName").textContent = displayName;
    document.title = `${displayName} | 企业常年法律顾问`;
  }

  const notice = document.getElementById("previewNotice");
  const markPreview = () => {
    notice.hidden = false;
    if (!document.querySelector('meta[name="robots"]')) {
      const robots = document.createElement("meta");
      robots.name = "robots";
      robots.content = "noindex,nofollow";
      document.head.appendChild(robots);
    }
  };
  if (!leadName || !qrSrc) markPreview();
  else notice.hidden = true;

  const qr = document.getElementById("wechatQr");
  const qrLink = document.getElementById("wechatQrLink");
  const placeholder = document.getElementById("qrPlaceholder");
  const contactName = (config.contactLawyerName || "").trim();
  if (contactName) qr.alt = `${contactName.endsWith("律师") ? contactName : `${contactName}律师`}微信二维码`;
  if (config.wechatQrFormat === "screenshot") qr.classList.add("qr-screenshot");
  else qr.classList.remove("qr-screenshot");
  const showQr = () => {
    qr.hidden = false;
    qrLink.hidden = false;
    placeholder.hidden = true;
  };
  const showMissingQr = () => {
    qr.hidden = true;
    qrLink.hidden = true;
    placeholder.hidden = false;
    markPreview();
  };
  if (qrSrc) {
    qrLink.href = qrSrc;
    qr.onload = showQr;
    qr.onerror = showMissingQr;
    if (qr.getAttribute("src") !== qrSrc) qr.src = qrSrc;
    else if (qr.complete) (qr.naturalWidth ? showQr : showMissingQr)();
  } else showMissingQr();

  const copyButton = document.getElementById("copyWechat");
  if (wechatId && navigator.clipboard) {
    copyButton.hidden = false;
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(wechatId);
        copyButton.textContent = "已复制微信号";
        window.setTimeout(() => {
          copyButton.textContent = "复制微信号";
        }, 2200);
      } catch {
        copyButton.textContent = `微信号：${wechatId}`;
      }
    });
  }

  const menuButton = document.getElementById("menuToggle");
  const nav = document.getElementById("siteNav");
  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "展开导航");
    nav.classList.remove("is-open");
  };
  menuButton.addEventListener("click", () => {
    const expanded = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!expanded));
    menuButton.setAttribute("aria-label", expanded ? "展开导航" : "收起导航");
    nav.classList.toggle("is-open", !expanded);
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
  const desktopQuery = window.matchMedia("(min-width: 761px)");
  if (desktopQuery.addEventListener) desktopQuery.addEventListener("change", closeMenu);
  else if (desktopQuery.addListener) desktopQuery.addListener(closeMenu);
  document.documentElement.classList.add("has-js");
})();
