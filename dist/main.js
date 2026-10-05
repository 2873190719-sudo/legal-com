(() => {
  "use strict";

  const config = window.SITE_CONFIG || {};
  const textValue = (value) => typeof value === "string" ? value.trim() : "";
  const element = (id) => document.getElementById(id);
  const isPersonal = document.body.dataset.page === "personal";
  const pageTitle = isPersonal ? "个人法律事务" : "企业法律服务";
  const leadName = textValue(config.leadLawyerName);
  const displayName = leadName ? leadName.endsWith("律师") ? leadName : `${leadName}律师` : "";
  const qrSrc = textValue(config.wechatQrSrc);
  const wechatId = textValue(config.wechatId);
  const contactName = textValue(config.contactLawyerName);

  if (displayName) {
    [element("brandName"), element("leadLawyerName")].forEach((node) => {
      if (node) node.textContent = displayName;
    });
    document.title = `${displayName} | ${pageTitle}`;
  }

  const notice = element("previewNotice");
  const originalRobots = document.querySelector('meta[name="robots"]');
  const originalRobotsContent = originalRobots && originalRobots.getAttribute("content");
  let previewRobots = originalRobots;
  let qrUnavailable = false;
  const updatePreview = () => {
    const needsPreview = !leadName || !qrSrc || qrUnavailable;
    if (notice) {
      notice.hidden = !needsPreview;
      if (needsPreview) {
        const missing = [];
        if (!leadName) missing.push("主办律师执业姓名");
        if (!qrSrc) missing.push("接待律师微信二维码");
        notice.textContent = missing.length
          ? `页面预览中：${missing.join("与")}待补齐，暂不用于公开推广。`
          : "页面预览中：接待律师微信二维码暂时无法加载，请核实图片后再公开推广。";
      }
    }
    if (needsPreview) {
      if (!previewRobots) {
        previewRobots = document.createElement("meta");
        previewRobots.name = "robots";
        document.head.appendChild(previewRobots);
      }
      const directives = textValue(originalRobotsContent).split(",").map((item) => item.trim()).filter(Boolean);
      const preserved = directives.filter((item) => !["index", "follow"].includes(item.toLowerCase()));
      previewRobots.content = [...new Set([...preserved, "noindex", "nofollow"])].join(",");
    } else if (previewRobots) {
      if (originalRobots) {
        if (originalRobotsContent === null) previewRobots.removeAttribute("content");
        else previewRobots.setAttribute("content", originalRobotsContent);
      } else {
        previewRobots.remove();
        previewRobots = null;
      }
    }
  };
  updatePreview();

  let actionStatus = element("actionStatus");
  let statusTimer;
  const announce = (message) => {
    if (!actionStatus) {
      const contact = element("contact");
      if (!contact) return;
      actionStatus = document.createElement("p");
      actionStatus.id = "actionStatus";
      actionStatus.className = "action-status";
      actionStatus.setAttribute("role", "status");
      actionStatus.setAttribute("aria-live", "polite");
      contact.appendChild(actionStatus);
    }
    actionStatus.hidden = false;
    actionStatus.textContent = message;
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => { actionStatus.hidden = true; }, 7000);
  };
  const selectForCopy = (field, container) => {
    if (!field) return;
    if (container) container.hidden = false;
    field.hidden = false;
    field.readOnly = true;
    field.focus();
    field.select();
    field.setSelectionRange(0, field.value.length);
  };
  const copyText = async (value, field, container, successMessage) => {
    if (field) field.value = value;
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      announce(successMessage);
    } catch {
      selectForCopy(field, container);
      announce("未能自动复制，文字已选中。请长按文字复制，或按 Ctrl+C / ⌘C 手动复制。");
    }
  };

  const qr = element("wechatQr");
  const qrLink = element("wechatQrLink");
  let placeholder = element("qrPlaceholder");
  const qrFrame = element("qrFrame");
  if (qr) {
    if (contactName) {
      const name = contactName.endsWith("律师") ? contactName : `${contactName}律师`;
      qr.alt = `${name}微信二维码`;
    }
    qr.classList.toggle("qr-screenshot", config.wechatQrFormat === "screenshot");
  }
  const showQr = () => {
    qrUnavailable = false;
    if (qr) qr.hidden = false;
    if (qrLink) qrLink.hidden = false;
    if (placeholder) placeholder.hidden = true;
    updatePreview();
  };
  const showUnavailableQr = () => {
    qrUnavailable = true;
    if (qr) qr.hidden = true;
    if (qrLink) qrLink.hidden = !qrSrc;
    if (!placeholder && qrFrame) {
      placeholder = document.createElement("div");
      placeholder.id = "qrPlaceholder";
      placeholder.className = "qr-placeholder";
      qrFrame.appendChild(placeholder);
    }
    if (placeholder) {
      placeholder.replaceChildren();
      const heading = document.createElement("strong");
      heading.textContent = qrSrc ? "二维码暂时无法加载" : "微信二维码待提供";
      placeholder.appendChild(heading);
      if (qrSrc) {
        const actions = document.createElement("div");
        actions.className = "qr-retry-actions";
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "copy-button";
        retry.textContent = "重新加载";
        retry.addEventListener("click", () => {
          if (!qr) return;
          let retrySrc = qrSrc;
          try {
            const url = new URL(qrSrc, window.location.href);
            if (["http:", "https:"].includes(url.protocol)) {
              url.searchParams.set("qr_retry", String(Date.now()));
              retrySrc = url.href;
            }
          } catch {
            // Keep the configured source when it cannot be resolved as a URL.
          }
          qr.removeAttribute("src");
          qr.src = retrySrc;
          announce("正在重新加载二维码，也可以直接打开原图。");
        });
        const original = document.createElement("a");
        original.href = qrSrc;
        original.target = "_blank";
        original.rel = "noopener";
        original.className = "text-link qr-original-link";
        original.textContent = "打开二维码原图";
        actions.append(retry, original);
        placeholder.appendChild(actions);
      }
      placeholder.hidden = false;
    }
    updatePreview();
  };
  if (qr && qrSrc) {
    if (qrLink) qrLink.href = qrSrc;
    qr.addEventListener("load", showQr);
    qr.addEventListener("error", showUnavailableQr);
    if (qr.getAttribute("src") !== qrSrc) qr.src = qrSrc;
    else if (qr.complete) (qr.naturalWidth ? showQr : showUnavailableQr)();
  } else if (!qrSrc) showUnavailableQr();

  const copyWechat = element("copyWechat");
  if (copyWechat) {
    copyWechat.hidden = !wechatId;
    if (wechatId) {
      const fallback = document.createElement("div");
      fallback.className = "copy-fallback";
      fallback.hidden = true;
      const label = document.createElement("label");
      label.htmlFor = "wechatIdText";
      label.textContent = "接待律师微信号";
      const field = document.createElement("textarea");
      field.id = "wechatIdText";
      field.rows = 1;
      field.readOnly = true;
      field.value = wechatId;
      field.setAttribute("aria-label", "接待律师微信号，可手动复制");
      fallback.append(label, field);
      copyWechat.insertAdjacentElement("afterend", fallback);
      copyWechat.addEventListener("click", () => copyText(wechatId, field, fallback, "微信号已复制，可粘贴到微信搜索框。"));
    }
  }

  const selectedTopic = element("selectedTopic");
  const selectedTopicText = element("selectedTopicText");
  const copyOpening = element("copyOpening");
  const openingField = element("openingText");
  const openingFallback = element("openingFallback");
  let opening = "";
  document.querySelectorAll('a[data-topic][href="#contact"]').forEach((card) => {
    card.addEventListener("click", () => {
      const topic = textValue(card.dataset.topic);
      if (!topic) return;
      const source = displayName ? `${displayName}的${pageTitle}页面` : `${pageTitle}页面`;
      const context = isPersonal
        ? "事情发生地：____\n事情经过及目前进展：____"
        : "企业所在地及主营业务：____\n事情经过及目前进展：____";
      opening = `您好，我看到${source}，想先沟通「${topic}」方面的问题。\n${context}\n最希望解决的问题：____\n方便先进行约 10 分钟初步沟通吗？`;
      if (selectedTopic) selectedTopic.hidden = false;
      if (selectedTopicText) selectedTopicText.textContent = `您想了解：${topic}`;
      if (copyOpening) copyOpening.hidden = false;
      if (openingField) openingField.value = opening;
      if (openingFallback) openingFallback.hidden = false;
      // Preserve native anchor scrolling and the no-JavaScript navigation path.
    });
  });
  if (copyOpening) copyOpening.addEventListener("click", () => {
    if (opening) copyText(opening, openingField, openingFallback, "微信开场白已复制。粘贴后请补充您的实际情况。");
  });

  const publicPageUrl = () => {
    try {
      const url = new URL(window.location.href);
      if (!["http:", "https:"].includes(url.protocol)) return "";
      const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
      if (!host || host === "localhost" || host.endsWith(".localhost")) return "";
      if (/\.(local|lan|internal|test|invalid|example)$/.test(host)) return "";
      if (host === "::" || host === "::1" || /^(fc|fd|fe[89ab])/.test(host) && host.includes(":")) return "";
      if (host.startsWith("::ffff:")) return "";
      const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
      if (ipv4) {
        const [a, b, c, d] = ipv4.slice(1).map(Number);
        if ([a, b, c, d].some((part) => part > 255)) return "";
        if (a === 0 || a === 10 || a === 127 || a >= 224) return "";
        if (a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168) return "";
        if (a === 100 && b >= 64 && b <= 127 || a === 198 && [18, 19].includes(b)) return "";
        if (a === 192 && b === 0 || a === 198 && b === 51 && c === 100 || a === 203 && b === 0 && c === 113) return "";
      } else if (!host.includes(".") && !host.includes(":")) return "";
      url.search = "";
      url.hash = "";
      url.username = "";
      url.password = "";
      return url.href;
    } catch {
      return "";
    }
  };
  const referralField = element("referralText");
  const copyReferral = element("copyReferral");
  const referralHint = element("referralHint");
  const publicUrl = publicPageUrl();
  let referral = referralField ? referralField.value.trim() : "";
  if (displayName) {
    const business = isPersonal
      ? "个人、家庭、工作与交易中的合同、借贷、婚姻继承、劳动、房产、侵权和知识产权等法律需求，均可先说明情况；由邓律师统筹了解，再沟通承办安排。"
      : "面向中山及珠三角企业，合同、用工、股权、知识产权、经营合规或纠纷需求均可先说明；单项事项与年度顾问都可沟通，具体承接安排结合事项确认。";
    referral = `广东融朗律师事务所${displayName}。${business}\n可添加同所接待律师微信，先进行约 10 分钟免费初步沟通，再根据实际需求沟通服务范围和预算；完整合同审查及文书制作另行约定。`;
  }
  if (publicUrl && referral) referral += `\n介绍页面：${publicUrl}`;
  if (referralField) {
    referralField.value = referral;
    referralField.readOnly = true;
  }
  if (referralHint) referralHint.textContent = publicUrl
    ? "介绍文字已附当前页面网址，可粘贴到微信转发。"
    : "当前为本地或非公开预览，介绍文字暂不附网址；上线后会自动附上实际页面网址。";
  if (copyReferral && referral && referralField) {
    copyReferral.hidden = false;
    copyReferral.addEventListener("click", () => copyText(referral, referralField, null, "转介绍文字已复制，可粘贴到微信转发。"));
  }

  const menuButton = element("menuToggle");
  const nav = element("siteNav");
  if (menuButton && nav) {
    const isExpanded = () => menuButton.getAttribute("aria-expanded") === "true";
    const closeMenu = (restoreFocus = false) => {
      const wasExpanded = isExpanded();
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "展开导航");
      nav.classList.remove("is-open");
      if (restoreFocus && wasExpanded) menuButton.focus({ preventScroll: true });
    };
    menuButton.addEventListener("click", () => {
      if (isExpanded()) closeMenu();
      else {
        menuButton.setAttribute("aria-expanded", "true");
        menuButton.setAttribute("aria-label", "收起导航");
        nav.classList.add("is-open");
      }
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
      const wasExpanded = isExpanded();
      closeMenu();
      if (wasExpanded && link.hash && link.pathname === window.location.pathname) {
        let target;
        try { target = element(decodeURIComponent(link.hash.slice(1))); } catch { return; }
        if (target) {
          if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
      }
    }));
    document.addEventListener("click", (event) => {
      if (isExpanded() && event.target instanceof Node && !menuButton.contains(event.target) && !nav.contains(event.target)) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isExpanded()) {
        event.preventDefault();
        closeMenu(true);
      }
    });
    if (typeof window.matchMedia === "function") {
      const desktop = window.matchMedia("(min-width: 801px)");
      const onBreakpoint = () => closeMenu(!desktop.matches && nav.contains(document.activeElement));
      if (desktop.addEventListener) desktop.addEventListener("change", onBreakpoint);
      else if (desktop.addListener) desktop.addListener(onBreakpoint);
    }
  }
  document.documentElement.classList.add("has-js");
})();
