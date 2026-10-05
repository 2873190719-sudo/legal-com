(() => {
  "use strict";

  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compact = window.matchMedia("(max-width: 760px)");
  const easeOut = "cubic-bezier(0.23, 1, 0.32, 1)";
  const liveAnimations = new Map();

  document.querySelectorAll("main section").forEach((section) => {
    const heading = section.querySelector("h1, h2");
    if (heading && !heading.hasAttribute("data-reveal")) heading.dataset.reveal = "rise";

    section.querySelectorAll("img:not(#wechatQr)").forEach((image) => {
      if (!image.hasAttribute("data-reveal")) image.dataset.reveal = "image";
      if (image.hasAttribute("data-parallax")) image.dataset.parallax = "18";
    });

    section.querySelectorAll(".work-card, .service, .demand-card, .support-card").forEach((card, index) => {
      if (!card.hasAttribute("data-reveal")) card.dataset.reveal = "fade";
      if (!card.hasAttribute("data-delay")) card.dataset.delay = String(Math.min(135, (index % 4) * 45));
    });
  });

  const finishReveal = (node, animate = false) => {
    if (!node.hasAttribute("data-motion-pending")) return;
    node.removeAttribute("data-motion-pending");
    if (!animate || reduced.matches || typeof node.animate !== "function") return;

    const startOpacity = node.getAttribute("data-motion-pending") === "true" ? 0 : 0.01;
    const isImage = node.dataset.reveal === "image";
    const isFade = node.dataset.reveal === "fade";
    const distance = isImage ? 8 : isFade ? 0 : 12;
    const scale = isImage ? 0.985 : 1;
    const parsedDelay = Number.parseInt(node.dataset.delay || "0", 10);
    const delay = Number.isFinite(parsedDelay) ? Math.max(0, Math.min(160, parsedDelay)) : 0;
    const animation = node.animate(
      [
        { opacity: startOpacity, transform: `translate3d(0, ${distance}px, 0) scale(${scale})` },
        { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }
      ],
      { duration: 420, delay, easing: easeOut, fill: "both" }
    );
    liveAnimations.set(node, animation);
    animation.finished.then(() => {
      if (liveAnimations.get(node) !== animation) return;
      liveAnimations.delete(node);
      animation.cancel();
    }).catch(() => {});
  };

  let revealObserver = null;
  const canReveal = !reduced.matches && "IntersectionObserver" in window;
  if (canReveal) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealObserver.unobserve(entry.target);
        finishReveal(entry.target, true);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -5% 0px" });

    document.querySelectorAll("[data-reveal]").forEach((node) => {
      const rect = node.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.88 || rect.bottom < 0) {
        node.setAttribute("data-motion-pending", "true");
        revealObserver.observe(node);
      } else if (rect.top >= 0) {
        finishReveal(node, true);
      }
    });
  }

  const menus = [];
  document.querySelectorAll("[data-menu-toggle][aria-controls]").forEach((button) => {
    const nav = document.getElementById(button.getAttribute("aria-controls"));
    const header = button.closest("[data-site-header]");
    if (!nav || !header) return;
    const menu = { button, nav, header };
    menus.push(menu);

    const close = (restoreFocus = false) => {
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "展开导航");
      header.dataset.menuOpen = "false";
      nav.hidden = compact.matches;
      if (restoreFocus) button.focus({ preventScroll: true });
    };

    if (compact.matches) nav.hidden = true;
    else nav.hidden = false;
    button.hidden = false;
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "展开导航");
    header.dataset.menuOpen = "false";

    button.addEventListener("click", () => {
      if (!compact.matches) return;
      const nextOpen = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(nextOpen));
      button.setAttribute("aria-label", nextOpen ? "收起导航" : "展开导航");
      header.dataset.menuOpen = String(nextOpen);
      nav.hidden = !nextOpen;
      if (nextOpen) {
        const firstLink = nav.querySelector("a[href]");
        if (firstLink) firstLink.focus({ preventScroll: true });
      }
    });

    nav.addEventListener("click", (event) => {
      if (!compact.matches || !(event.target instanceof Element)) return;
      if (event.target.closest("a[href]")) close();
    });

    document.addEventListener("pointerdown", (event) => {
      if (!compact.matches || button.getAttribute("aria-expanded") !== "true") return;
      if (event.target instanceof Node && !header.contains(event.target)) close();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") close(true);
    });
  });

  if (compact.addEventListener) {
    compact.addEventListener("change", () => {
      menus.forEach(({ button, nav, header }) => {
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "展开导航");
        header.dataset.menuOpen = "false";
        nav.hidden = compact.matches;
      });
    });
  } else if (compact.addListener) {
    compact.addListener(() => {
      menus.forEach(({ button, nav, header }) => {
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "展开导航");
        header.dataset.menuOpen = "false";
        nav.hidden = compact.matches;
      });
    });
  }

  const releaseReducedMotion = () => {
    if (!reduced.matches) return;
    liveAnimations.forEach((animation, node) => {
      animation.cancel();
      node.removeAttribute("data-motion-pending");
    });
    liveAnimations.clear();
    document.querySelectorAll('[data-motion-pending="true"]').forEach((node) => finishReveal(node));
    revealObserver?.disconnect();
    revealObserver = null;
  };
  if (reduced.addEventListener) reduced.addEventListener("change", releaseReducedMotion);
  else if (reduced.addListener) reduced.addListener(releaseReducedMotion);

  document.addEventListener("focusin", (event) => {
    if (!(event.target instanceof Element)) return;
    const pending = event.target.closest('[data-motion-pending="true"]');
    if (pending) finishReveal(pending);
  });

  document.querySelectorAll('a[href="#contact"]').forEach((link) => {
    if (!link.hasAttribute("aria-label") && !link.textContent.trim()) {
      link.setAttribute("aria-label", "与律师进行微信初步沟通");
    }
  });
  root.classList.add("motion-ready");
  releaseReducedMotion();
})();
